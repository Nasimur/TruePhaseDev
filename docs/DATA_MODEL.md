# Data model

All user records live in the browser's IndexedDB, in a database named **`TruePhase`** that is managed with [Dexie](https://dexie.org/). Nothing is sent to a server. Types are defined in `frontend/src/models/types.ts`.

## Date semantics

- Every date is a string in `YYYY-MM-DD` format, meaning a **local calendar day** with no time or time zone. `2026-11-10` means 10 November wherever the user is.
- Validators check that a date is real. For example, `2026-02-30` is rejected (`isValidDate` in `models/validation.ts`, `isRealDate` in `features/periods/dateUtils.ts`).
- Because the format is fixed-width and zero-padded, plain string comparison sorts dates in chronological order. The code compares dates this way, for example `endDate >= startDate`.
- "Today" is built from the device's local date (`localTodayKey()`), never from a UTC timestamp. That avoids an off-by-one day near midnight.

## `PeriodRecord` (on `main`)

```ts
interface PeriodRecord {
  id: string;             // non-empty; new records use crypto.randomUUID()
  startDate: string;      // YYYY-MM-DD, required
  endDate: string | null; // YYYY-MM-DD on or after startDate, or null = ongoing
}
```

**Rules** (enforced by the repository when saving):

- `id` is a non-empty string.
- `startDate` is a real date.
- `endDate` is `null` or a real date on or after `startDate`.
- Periods may not overlap, and both start and end dates count as part of the period. Saving a record with an existing `id` is treated as an edit, so the record isn't compared with its own older copy.
- An ongoing period (`endDate: null`) counts as lasting indefinitely when checking for overlaps. As a result there can be only one ongoing period, and no period can start after it until it is given an end date.

**Store:** `periods`, Dexie schema `"&id,startDate"`

- Primary key: `id`, which must be unique.
- Index: `startDate`. `list()` returns records sorted by `startDate`.

## `DailyLog` (type on `main`, storage planned in Phase B)

```ts
type Flow   = "none" | "spotting" | "light" | "medium" | "heavy";
type Mood   = "happy" | "sad" | "neutral" | "calm" | "anxious" | "irritable";
type Energy = "low" | "medium" | "high";

interface DailyLog {
  date: string;              // YYYY-MM-DD; one log per date
  painLevel: number | null;  // whole number 0–10, or null when not recorded
  moods: Mood[];             // no duplicates; may be empty
  energy: Energy | null;
  flow: Flow | null;
  notes: string | null;      // at most 500 characters
}
```

**Rules** (`isValidDailyLog` in `models/validation.ts`):

- All six keys must be present. Optional values use `null`, never `undefined`.
- `date` is a real date.
- `painLevel` is `null` or a whole number from 0 to 10.
- `moods` contains only known moods with no duplicates. An empty array is allowed.
- `energy` and `flow` are `null` or one of the listed values.
- `notes` is `null` or a string of up to 500 characters.

**Planned store:** `dailyLogs`, with **`date` as the primary key**, so there is exactly one log per day and saving an existing date updates that log. The repository API (`get(date)`, `list(range)`, `save(log)`, `remove(date)`) and whether `save` replaces the whole record or patches it will be agreed between the storage owner (Annifa) and the UI owner (Jawmis) before the form is built.

**Data minimization:** don't add fields to `DailyLog` without a clear user benefit, a schema review and a privacy assessment (ADR-004 in [`plan.md`](../plan.md)). In particular, profile fields used only by the research model, such as BMI or pregnancy history, are out of scope.

## Schema versions and migration

| Dexie version | Stores | Status |
| --- | --- | --- |
| 1 | `periods: "&id,startDate"` | On `main` |
| 2 | `periods: "&id,startDate"`, `dailyLogs: "&date"` | Planned (Phase B) |

**Rules for schema changes:**

1. **Never edit an existing `version(n)` block.** Always add `version(n + 1)`. Dexie carries forward any store you don't redefine.
2. **Moving from v1 to v2 only adds a store.** Existing `periods` records must survive unchanged. If a migration also needs to transform data, use an `.upgrade(tx => …)` callback and test it.
3. **Test upgrades:** create a v1 database with `fake-indexeddb`, add periods, open it with the v2 class, and check that the periods are still there and `dailyLogs` works.
4. **Don't downgrade.** Opening a database with an older schema than the one stored fails. Releases must only move the version forward.

> Browser DevTools show the IndexedDB version as Dexie's version × 10 (for example, version 1 appears as `10`). This is normal Dexie behaviour.

## Validation

There are currently two period validators:

| Module | Used by | Returns |
| --- | --- | --- |
| `features/periods/periodValidation.ts` (`isValidPeriodRecord`, `validatePeriod`) | `PeriodRepository`, `CalendarPage` | Form error messages |
| `models/validation.ts` (`isValidPeriodRecord`, `canSavePeriod`) | Tests only | `boolean` |

They apply the same rules. Phase B will reconcile them into one source of truth so the rules can't drift apart. The likely approach is to keep the shared validators in `models/` and derive the form messages from them. `isValidDailyLog` exists only in `models/validation.ts`, and the daily-log repository should use it.

## Errors

| Error | When |
| --- | --- |
| `PeriodValidationError` | A record fails validation or overlaps another record. The message is suitable to show the user. |
| `InvalidStoredPeriodError` | Data already in IndexedDB fails validation. The operation stops without writing, so nothing is overwritten. |

## Storage limits

IndexedDB is per browser profile and per site. It is **not encrypted by TruePhase and is not a backup**. See [PRIVACY.md](../PRIVACY.md) for what that means for users.
