# TruePhase

TruePhase is a local-first cycle tracking app. The frontend uses React, TypeScript, Vite, and IndexedDB for period records.

## Getting started

Install Node.js 20.19+ or 22.12+ and npm. From the repository root, run:

```sh
cd frontend
npm ci
npm run dev
```

Open the local URL printed by Vite. Other commands:

```sh
npm run build
npm run preview
npm run typecheck
npm test
```

## App structure

- `src/app/` owns routes and the responsive navigation shell.
- `src/pages/` holds route components. Insights and settings remain placeholders for later issues.
- `src/features/periods/` holds calendar date helpers, form validation, IndexedDB persistence, and the async `PeriodRepository` contract.
- `src/styles/` holds the shared theme and responsive styles.
- `src/models/` contains the team's shared data models.

Period records are stored in this browser's IndexedDB database and remain available after reloads. Browser storage can be cleared and is not an encrypted backup; avoid using a shared device for sensitive entries. Period data is not sent to a server.

The shared `PeriodRecord` type is used by the calendar. `Mood` and `Energy` definitions were added to the existing model types so the frontend can typecheck that import. The separate `src/models/validation.ts` work is still in progress; it is not used by this calendar form. Once it is complete, its validators can replace the local period form checks.
