# Architecture

TruePhase is a local-first progressive web app (PWA). Everything runs in the browser: there is no TruePhase server, no account, and no backend API. Health data is stored on the user's device in IndexedDB, and predictions are calculated on the device.

Each section below is marked with its status:

- **On `main`**: merged and available.
- **In review**: an open pull request.
- **Planned**: agreed in [`plan.md`](../plan.md) but not yet built.

## Overview

```
┌──────────────────────────── Browser ────────────────────────────┐
│                                                                 │
│   React UI (pages, calendar, forms)                             │
│        │                         │                              │
│        ▼                         ▼                              │
│   Repositories              Prediction engine (planned)         │
│   (validated CRUD)          pure TypeScript, no I/O             │
│        │                                                        │
│        ▼                                                        │
│   Dexie ──► IndexedDB "TruePhase"   ◄── private user records    │
│                                                                 │
│   Service worker ──► Cache Storage  ◄── static app files only   │
└─────────────────────────────────────────────────────────────────┘
              │
              ▼
     Static host (HTML, JS, CSS, icons). It never receives health data.
```

## Layers

### UI: React + TypeScript + Vite (on `main`)

| Path | Responsibility |
| --- | --- |
| `frontend/src/main.tsx` | Mounts the app inside `BrowserRouter`. |
| `frontend/src/app/` | Routes (`App.tsx`) and the responsive navigation shell (`AppShell.tsx`). |
| `frontend/src/pages/` | Route components: Overview, Calendar, and placeholders for Insights and Settings. |
| `frontend/src/styles/` | Shared theme and responsive CSS. |

Pages depend on repository **interfaces**, not on Dexie directly. For example, `CalendarPage` takes an optional `repository` prop that defaults to the IndexedDB implementation, so tests and future features can pass in a different one.

### Domain models and validation (on `main`)

- `frontend/src/models/types.ts` defines the shared `PeriodRecord` and `DailyLog` types.
- `frontend/src/models/validation.ts` contains shared validators: `isValidDate`, `isValidPeriodRecord`, `isValidDailyLog` and `canSavePeriod`.
- `frontend/src/features/periods/periodValidation.ts` contains the period validator the calendar uses. It returns error messages for the form.

> **Known duplication:** period-record validation exists in both `models/validation.ts` and `features/periods/periodValidation.ts`. Phase B of the plan will reconcile them into one path. See [DATA_MODEL.md](DATA_MODEL.md#validation).

### Persistence: Dexie over IndexedDB (on `main`)

- `frontend/src/features/periods/periodDatabase.ts` defines the Dexie database `TruePhase`. Schema version 1 has one store, `periods`.
- `frontend/src/features/periods/periodRepository.ts` defines the `PeriodRepository` interface (`list`, `save`, `remove`) and its IndexedDB implementation.
  - `save` validates the record, then checks for overlaps **inside a read-write transaction**, so two saves can't race past the overlap check.
  - `list` and `save` refuse to continue if stored data fails validation (`InvalidStoredPeriodError`), rather than silently overwriting it.
- **Planned (Phase B):** schema version 2 adds a `dailyLogs` store keyed by date, plus a matching `DailyLogRepository`.

See [DATA_MODEL.md](DATA_MODEL.md) for fields, keys and migration rules.

### Offline shell: service worker (in review, [PR #17](https://github.com/Nasimur/TruePhaseDev/pull/17))

- `frontend/scripts/build-sw.mjs` runs after `vite build` and writes `dist/sw.js`. The worker's cache name is a hash of the list of built files.
- **What it caches:** only the app shell (`/`, `index.html`, manifest, favicon, icons, and the built JS and CSS).
- **Page loads:** it tries the network first and falls back to the cached `index.html`. Static files come from the cache first.
- **What it leaves alone:** requests to other origins, non-GET requests and `/api/` paths.
- It never reads or writes IndexedDB.
- It is registered only in production builds (`import.meta.env.PROD`). `npm run dev` never registers it.

### Prediction engine (planned, Phase D)

This will be a pure TypeScript module. It takes validated `PeriodRecord[]` and returns an estimate, or an "insufficient data" result. It must not import React or read IndexedDB itself. The UI loads the history through the repository and passes it in. See [PREDICTIONS.md](PREDICTIONS.md).

## Data flow

### Saving a period (on `main`)

1. The user selects dates in the `CalendarPage` form.
2. The page validates the form, then calls `repository.save({ id, startDate, endDate })`. New records get their ID from `crypto.randomUUID()`.
3. Inside a Dexie transaction, the repository checks the stored records, rejects overlaps, and writes the record.
4. The page reloads the list from the repository and redraws the calendar.

No network request is made at any step.

### Opening the app offline (in review, [PR #17](https://github.com/Nasimur/TruePhaseDev/pull/17))

1. The first online visit installs the service worker and caches the app shell.
2. Later, while offline, a page load falls back to the cached `index.html`, and the JS and CSS load from the cache.
3. The app reads records from IndexedDB as usual.

## Architecture decisions

These summarize ADR-001 to ADR-005 in [`plan.md`](../plan.md#2-architecture-decisions-proposed-for-team-approval):

1. **Local-first health data.** No telemetry, analytics or cloud sync without a privacy review and an explicit opt-in design.
2. **The service worker caches static files only.** IndexedDB is the source of truth for user records.
3. **Predictions run in the browser.** Python is used for research only.
4. **Collect as little data as possible.** Don't add profile fields just because a research model uses them.
5. **Predictions are estimates, not medical advice.**

## Not in scope

This list matches the plan's alpha scope:

- A backend server
- User accounts
- Cloud sync
- Push notifications
- Third-party analytics
