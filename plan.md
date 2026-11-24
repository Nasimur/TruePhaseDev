# TruePhase — Development Plan

**Updated:** November 23, 2026  
**Project:** [Nasimur/TruePhaseDev](https://github.com/Nasimur/TruePhaseDev)  
**Goal:** Deliver a privacy-first, open-source menstrual cycle tracking PWA that works offline, stores user records on-device, and produces appropriately qualified next-period estimates locally.

> **Team review requested:** The owners below are proposed from existing GitHub assignments. Confirm scope, capacity, and dates together before treating them as commitments.

## 1. Where we stand

### Implemented on `main` (source-level review)
- React + TypeScript + Vite frontend and responsive calendar.
- Create, edit, and remove period records.
- IndexedDB-based period persistence using Dexie (`periods` store, schema version 1).
- Shared `PeriodRecord` and `DailyLog` TypeScript models and validation functions.
- Period validation and repository tests are present; latest execution results have **not** been independently verified.

### Work not yet integrated into `main`
- PWA manifest, service worker and offline app-shell caching are on the `feat/issue-6-pwa-support` branch. PR #15 was merged into the calendar feature branch, **not `main`**. The calendar feature branch PR #14 was likewise merged into its foundation branch. Do not assume either is live on `main`. **Update:** [PR #17](https://github.com/Nasimur/TruePhaseDev/pull/17) (`feat/pwa-integration`) ports this work onto current `main` and is in review.
- The `Marcus-Algo` branch has a Python random-forest research baseline and saved evaluation results; it is **not** a browser prediction engine or a merged production feature.

### Remaining gaps
- IndexedDB has no `dailyLogs` store or dedicated daily-log repository.
- No daily symptom/mood input interface connected to persistence.
- No TypeScript prediction engine or predicted-period calendar UI.
- Offline + IndexedDB flow verified in Chromium on PR #17; real-device install and cross-browser checks still outstanding.
- Project documentation and CI are added on `chore/docs-ci` (see Phase E); they need team review.

## 2. Architecture decisions (proposed for team approval)

**ADR-001 — Local-first health data.** Period records, daily logs and user-entered symptoms stay in the browser's IndexedDB by default. The app should not send them to a prediction server, telemetry service, or third-party API. Do not add analytics or cloud synchronization without an explicit privacy review and clear opt-in design.

**ADR-002 — PWA and IndexedDB are complementary.** The PWA service worker caches **static application assets only** for offline loading. IndexedDB stores private user records and must remain the source of truth. When bringing in the PWA branch, preserve the newer IndexedDB period repository on `main`; do **not** replace it with the older in-memory demo repository.

**ADR-003 — Browser-local predictions.** Research and benchmarking may use Python, but the MVP prediction calculation runs locally in TypeScript, without a backend or requirement to install a native app. Start with transparent history-based baselines (e.g. median/mean). A more complex on-device model is optional only if evaluation justifies it.

**ADR-004 — Minimize sensitive data collection.** Daily logs collect only fields needed for user-facing logging. Do not add BMI, pregnancy history or other personal profile fields solely because the experimental random forest uses them. Any proposed fields require a clear user benefit, schema review and privacy assessment.

**ADR-005 — Predictions are estimates, not medical advice.** Display uncertainty, handle insufficient/irregular history gracefully, and avoid contraception, fertility-certainty or diagnosis claims.

## 3. Team responsibilities

| Team member | Primary ownership | Review/support duties |
| --- | --- | --- |
| **Nasimur** (project lead) | Integration plan, architecture/documentation, CI and end-to-end QA | Review PRs; coordinate interfaces; pair on TypeScript prediction engine |
| **Annifa** (`AnnifaGhanie`) | Dexie schema version 2, daily-log storage, CRUD and persistence tests | Coordinate database contract with Jawmis; help verify upgrade preserves existing periods |
| **Jawmis** (`Jawmis`) | PWA integration, daily-log UI, calendar integration | Test installation/offline navigation and user experience |
| **snorlaxmc** | Prediction research, evaluation and algorithm specifications | Help implement and test browser-local TypeScript prediction logic with Nasimur |

The team should keep feature PRs small and request at least one peer review before merging into `main`.

## 4. Workstreams and deliverables

### Phase A — Stabilize `main` and integrate PWA (highest priority)
**Owner:** Jawmis  
**Support/reviewer:** Nasimur  
**Related:** [PR #14](https://github.com/Nasimur/TruePhaseDev/pull/14), [PR #15](https://github.com/Nasimur/TruePhaseDev/pull/15), [Issue #6](https://github.com/Nasimur/TruePhaseDev/issues/6), [Issue #7](https://github.com/Nasimur/TruePhaseDev/issues/7)

- [x] Create a fresh integration branch from current `main` (suggested `feat/pwa-integration`).
- [x] Port the manifest, icons, build/service-worker changes and offline shell behavior from the PWA branch.
- [x] **Keep** the IndexedDB-backed `periodRepository.ts`, database file and persistence tests currently on `main`.
- [x] Resolve any calendar/UI conflicts carefully; do not restore mock-only storage.
- [ ] Run build, typecheck and unit tests; test installability in a supported browser. *(Checks pass in PR #17; manual Install click on a real browser/phone still to do.)*
- [x] Load the app online once; then test offline navigation and verify period entries survive a full reload.
- [x] Confirm that the service worker does not cache period/symptom data or API responses.
- [x] Document service-worker update behavior, browser limitations and recovery steps.

**Acceptance criteria:** App can be installed where supported; initial visit enables offline shell loading; create/edit/delete period records remain persistent across reloads; no regressions to `main` period storage; checks pass. Close #6/#7 only once acceptance criteria are verified on `main`.

### Phase B — DailyLog database and repository
**Owner:** Annifa  
**Support/reviewer:** Nasimur  
**Related:** [Issue #10](https://github.com/Nasimur/TruePhaseDev/issues/10), [Issue #11](https://github.com/Nasimur/TruePhaseDev/issues/11), [Issue #12](https://github.com/Nasimur/TruePhaseDev/issues/12)

- [ ] Upgrade Dexie schema from version 1 to version 2, preserving existing period records.
- [ ] Add `dailyLogs` store with **date as primary key** (`YYYY-MM-DD` local-calendar key); one record per date.
- [ ] Reuse the existing `DailyLog` model and shared validators; reconcile any duplicate validation paths.
- [ ] Implement a typed daily-log repository with `get(date)`, `list(range)`, `save(log)` / update, and `remove(date)` operations.
- [ ] Ensure editing a date updates its existing record instead of creating duplicates.
- [ ] Reject invalid date keys, out-of-range pain levels, duplicate moods and malformed values.
- [ ] For partial updates, preserve unspecified fields; document whether the API is a full replacement or patch operation.
- [ ] Add automated tests for CRUD, uniqueness, valid/invalid fields, empty mood arrays, migration from v1, and persistence after reopening the database.
- [ ] Confirm existing `PeriodRecord` CRUD/overlap protection still works after migration.

**Acceptance criteria:** Both `periods` and `dailyLogs` stores work in the browser; v1 records survive upgrading; one daily log per date; validated CRUD passes unit/integration tests.

**Contract checkpoint:** Before coding the form, Annifa and Jawmis agree on repository method names, errors, and how a calendar date selects the matching log.

### Phase C — Daily symptom/mood logging UI
**Owner:** Jawmis  
**Support:** Annifa (repository API), Nasimur (QA)

- [ ] Add a daily log form from calendar date selection, with existing fields: pain level (0–10 or blank), multiple moods, energy, flow and optional notes (max 500 characters).
- [ ] Load a previously saved log when reselecting a date; support edit and delete.
- [ ] Show clear save/error feedback and validate before writing.
- [ ] Make the form usable on mobile, keyboard and screen readers.
- [ ] Ensure changing a daily log does not inadvertently alter the period record for that date.
- [ ] Test that entries remain accessible after reload and offline, with no backend requests.

**Acceptance criteria:** A user can create, view, edit and delete daily logs by date; edits do not duplicate records; logs remain on-device across reloads.

### Phase D — Research, evaluate and implement local predictions
**Research owner:** snorlaxmc  
**Browser implementation:** snorlaxmc + Nasimur  
**UI integration:** Jawmis  
**Related:** [Issue #8](https://github.com/Nasimur/TruePhaseDev/issues/8), [Issue #9](https://github.com/Nasimur/TruePhaseDev/issues/9)

**D1 — Research quality**
- [ ] Correct `research/README.md`: the current random-forest script refers to real-world FedCycleData, so it is inaccurate to say all research data is synthetic.
- [ ] Document dataset origin/license, permitted use, limitations and reproducibility steps; never commit raw personal health data.
- [ ] Provide a reproducible synthetic dataset for unit tests and edge cases.
- [ ] Re-evaluate constant-28, last-cycle, historical mean, historical median and random forest using the same holdout approach and **only features realistically available within TruePhase**.
- [ ] Check short history, missing records, irregular cycles, unusually long/short values, and stability across subgroups where data supports it.
- [ ] Report MAE and uncertainty limitations; do not judge an algorithm only by a tiny change in aggregate MAE.

**D2 — Production engine**
- [ ] Define a **pure TypeScript interface** accepting validated historical `PeriodRecord[]` and returning a predicted start date or an insufficient-data result, an estimated cycle length, and an uncertainty descriptor.
- [ ] Start with an explainable median/mean baseline; ensure it does not read directly from IndexedDB or import React.
- [ ] Define a clear minimum-history policy and behavior when ongoing periods or inconsistent records exist.
- [ ] Add fixed-input TypeScript tests whose expected outputs match the Python research reference cases.
- [ ] Compute the estimate locally; never send cycle history to a prediction API.
- [ ] Add a predicted-period indicator in the calendar that is visually distinct from recorded periods and labeled as an estimate.
- [ ] Explain that predictions are not suitable as contraception or medical diagnosis.

**Acceptance criteria:** Browser works offline and returns reproducible estimates from local period history; users can distinguish recorded from predicted dates; appropriate uncertainty and insufficient-data states are shown.

**Research checkpoint:** The saved results on `Marcus-Algo` currently report random forest MAE **2.213 days** and historical median MAE **2.282 days**. These values are *reported branch artifacts, not independently reproduced results*; the small difference alone does not justify shipping random forest for the MVP.

### Phase E — Documentation, CI, privacy and release readiness
**Owner:** Nasimur  
**Reviewers:** entire team

- [ ] Keep this root `plan.md` current as PRs close.
- [x] Add `docs/ARCHITECTURE.md` (PWA, service worker, IndexedDB, prediction module, data flow).
- [x] Add `docs/DATA_MODEL.md` (fields, validation, date semantics, schema v1→v2 migration).
- [x] Add `docs/PREDICTIONS.md` (input data, algorithm, evaluation, uncertainty and limitations).
- [x] Add `CONTRIBUTING.md` (setup, branch conventions, tests and PR review expectations).
- [x] Add a concise privacy disclosure: no server-side health-data upload by default; browser storage can be cleared and is **not encrypted backup**. *(See `PRIVACY.md`.)*
- [ ] Plan user-controlled export/import, deletion and data-loss recovery **before public release**; do not imply local storage is permanent or encrypted. *(Requirements listed in `PRIVACY.md`; design/implementation not started.)*
- [x] Add GitHub Actions CI for `npm ci`, `npm run typecheck`, `npm test` and `npm run build` from `frontend/`.
- [ ] Run cross-browser and mobile testing (including PWA/IndexedDB behavior) and capture the results.
- [x] Review dependencies and external requests; avoid inadvertent data transmission. *(Nov 23: `npm audit` 0 vulnerabilities; only external request on `main` is Google Fonts, removed by PR #17.)*

**Acceptance criteria:** A contributor can reproduce setup/tests from docs; PRs receive automated checks; app's privacy limits and data-loss risks are transparent.

## 5. Dependency order and parallel work

1. **Immediately in parallel:** Jawmis begins Phase A; Annifa begins schema/repository Phase B; snorlaxmc validates research in D1; Nasimur starts Phase E documentation/CI.
2. **After Annifa/Jawmis agree on repository contract:** Jawmis can begin Phase C UI with a mock repository and then switch to the real API.
3. **After local period history and prediction specification are stable:** snorlaxmc and Nasimur implement D2 as a pure TypeScript module.
4. **Integration gate:** Review, merge and test feature branches against current `main` (not against stale feature branches).
5. **MVP alpha acceptance:** Whole team verifies installation, offline access, period save/edit/delete, daily-log save/edit/delete, persistence after reload, and clear next-period estimates.

## 6. Branch/PR conventions

Suggested branches, each created from current `main`:

| Branch | Owner | Purpose |
| --- | --- | --- |
| `feat/pwa-integration` | Jawmis | Merge PWA behavior without overwriting IndexedDB |
| `feat/daily-log-storage` | Annifa | Dexie v2 + DailyLog repository/tests |
| `feat/daily-log-ui` | Jawmis | Daily logging interface |
| `research/prediction-evaluation` | snorlaxmc | Research reproducibility and evaluation |
| `feat/local-predictions` | snorlaxmc + Nasimur | TypeScript prediction engine/tests |
| `chore/docs-ci` | Nasimur | Documentation, CI and QA checklist |

Each PR should state: linked issue(s), changes, migration/privacy impacts, commands tested, screenshots if UI changed, and known limitations. Avoid merging a PR into a feature branch and treating it as shipped in `main`.

## 7. Shared alpha test checklist

- [ ] Fresh install: app loads and calendar works.
- [ ] Enter, edit and remove periods; invalid/overlapping dates rejected.
- [ ] Reload/close/reopen: saved periods remain.
- [ ] Upgrade old v1 database to v2: existing periods remain.
- [ ] Enter, edit and remove daily logs; exactly one log per date.
- [ ] Reload/close/reopen: daily logs remain.
- [ ] After initial online load, app shell and stored records work while offline.
- [ ] Service-worker caches contain static assets only, not health records.
- [ ] Predicted periods use local history and display uncertainty/insufficient data clearly.
- [ ] No health data is sent to a backend or third-party service during core flows.
- [ ] Automated build, typecheck and tests pass; manual mobile/browser checks documented.

## 8. Definition of done for MVP alpha

A user can install or open TruePhase, record their period, log symptoms for a day, close and reopen the app offline, retrieve their data, and view a distinctly marked, qualified estimate of the next period. All core data and prediction calculations remain on-device. The team has verified the flow end-to-end and documented data-loss, privacy and prediction limitations.

**Out of scope for alpha:** Account creation, cloud sync, fertility/contraception guarantees, medical diagnosis, and collecting extra intimate profile details purely to feed a model.

---

**Next team sync:** Confirm task ownership, coordinate the DailyLog repository contract, decide the local-prediction baseline and set realistic milestone dates. Track progress in linked GitHub issues and PRs rather than duplicating status manually.
