# Predictions

> **Status:** planned (Phase D). There is **no prediction feature on `main` yet**. This document sets out the agreed approach and records the research findings so far, so the browser engine can be built against a clear spec.

TruePhase will estimate when the next period is likely to start. The estimate is calculated **in the browser** from the user's own period history and is never sent anywhere (ADR-001 and ADR-003 in [`plan.md`](../plan.md)).

## Scope and wording

- An estimate is a **guide, not medical advice**. It must not be used for contraception, conception timing or diagnosis.
- The UI must:
  - show the predicted dates so they look different from recorded periods,
  - label them as an estimate,
  - show how uncertain the estimate is,
  - and show a clear "not enough history" state instead of guessing.
- Fertile-window or ovulation predictions are **out of scope** for the alpha.

## Engine interface (draft, to be confirmed in Phase D)

```ts
type PredictionResult =
  | {
      kind: "estimate";
      nextStartDate: string;          // YYYY-MM-DD
      cycleLengthDays: number;        // estimated typical cycle length
      uncertainty: {
        earliestStartDate: string;    // YYYY-MM-DD
        latestStartDate: string;      // YYYY-MM-DD
        basis: string;                // short explanation, e.g. "spread of your last 6 cycles"
      };
      cyclesUsed: number;
    }
  | {
      kind: "insufficient-data";
      reason: "too-few-cycles" | "ongoing-only" | "inconsistent-records";
      cyclesNeeded?: number;
    };

function predictNextPeriod(
  history: readonly PeriodRecord[],   // already validated, any order
  today: string,                      // YYYY-MM-DD, local
): PredictionResult;
```

**Constraints:**

- The function must be **pure**: no IndexedDB, no React, no `Date.now()` (pass `today` in), and no network. The UI loads records through the repository and passes them in.
- The same input must always give the same output.
- It must run offline in every supported browser.

## Baseline algorithm (recommended starting point)

1. Sort periods by `startDate`. A **cycle length** is the number of days from one period's start to the next period's start.
2. Exclude cycle lengths outside a plausible range. The exact limits are still to be agreed; 15–90 days is a candidate. Report how many cycles were excluded.
3. If there are fewer than *N* valid cycles, return `insufficient-data`. The minimum history *N* is to be agreed; 2–3 is a likely candidate.
4. **Estimated cycle length:** the median of the most recent *K* valid cycles. Median is preferred over mean because it is less affected by a single unusual cycle.
5. **Next start date:** the most recent period's start date plus the estimated cycle length. If that date is already in the past, report the estimate as overdue instead of moving it forward without saying so.
6. **Uncertainty:** use the spread of recent cycle lengths (for example, the range or the interquartile range), shown as an earliest-to-latest window.

**Open decisions for the team:** *N*, *K*, the exclusion limits, the method for the uncertainty range, and how an ongoing period (`endDate: null`) affects the result.

## Research findings so far

The `Marcus-Algo` branch contains a Python research baseline in `research/models/random_forest_baseline.py`.

- **Data:** Marquette FedCycleData, a real, public, de-identified dataset from Kaggle (`nikitabisht/menstrual-cycle-data`). It must be downloaded into `research/data/raw/` and is **never committed**.
- **Task:** predict the next cycle length using only information available when the cycle starts.
- **Holdout:** 20% of people are held out (grouped by person, seed 42). That gives 118 people (1,157 cycles) for training and 30 people (349 cycles) for testing.

**Reported mean absolute error (MAE), in days:**

| Method | MAE |
| --- | --- |
| Constant 28 days | 2.650 |
| Last cycle length | 2.923 |
| Mean of history | 2.299 |
| **Median of history** | **2.282** |
| Random forest | 2.213 |

**Caveats:**

- These numbers are from a saved results file and **have not been independently reproduced**.
- The random forest uses profile and clinical features (BMI, number of pregnancies, living children, breastfeeding, age, reproductive category, menses scores) that TruePhase does not and should not collect (ADR-004). Its importance scores show that almost all of its accuracy comes from `history_mean`.
- The random forest is only 0.07 days better than the median baseline, from a 30-person test set. That gap is too small to justify shipping a more complex model.
- The research README currently says "all data here is synthetic". That is inaccurate for this script, and Phase D1 will correct it.

**Recommendation:** ship the median-of-history baseline first. Revisit more complex models only if a re-evaluation **using only features TruePhase collects** shows a clear, robust improvement.

## Testing requirements (Phase D2)

- Fixed-input unit tests covering:
  - no history
  - one period
  - an ongoing period only
  - regular cycles
  - irregular cycles
  - a single outlier
  - an out-of-range gap (a missed log)
  - unsorted input
  - a prediction date that is already in the past
- Reference cases computed by the Python research code, so the TypeScript and Python results agree on the baseline.
- Use a reproducible **synthetic** fixture dataset for tests. Never use real personal data in tests.
