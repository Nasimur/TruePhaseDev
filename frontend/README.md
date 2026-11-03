# TruePhase

TruePhase is an early cycle tracking app. This branch establishes the React, TypeScript, and Vite frontend for issue #5.

## Getting started

Install Node.js 20.19+ or 22.12+ and npm. From the repository root, run:

```sh
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite. Other commands:

```sh
npm run build
npm run preview
npm run typecheck
```

## App structure

- `src/app/` owns routes and the responsive navigation shell.
- `src/pages/` holds route components. Calendar, insights, and settings are honest placeholders for later issues.
- `src/styles/` holds the shared theme and responsive styles.
- `src/models/` contains the team's existing shared data models. Their contents are preserved unchanged on this branch.

The app shell is separate from feature content. Future calendar and daily-log components can replace a page route without changing navigation. A future data module can provide an async interface to IndexedDB or a server, keeping persistence out of the UI components. No health data is collected or stored by this scaffold.

The existing `src/models/` work is still in progress: its type and validation files currently reference symbols that have not been defined there yet. The app TypeScript project includes only the new frontend paths until that shared model work is complete. Once it is, add the models to the TypeScript project and import `PeriodRecord` and `DailyLog` into the relevant feature pages.
