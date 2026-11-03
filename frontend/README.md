# TruePhase

TruePhase is an early cycle tracking app. The frontend uses React, TypeScript, and Vite, with a demo calendar and period entry form.

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
```

## Install and offline use

The production build includes a web app manifest, 192 px and 512 px icons, and a service worker. To check it locally:

```sh
npm run build
npm run preview
```

Open the preview URL on `localhost` or `127.0.0.1`, allow the first visit to finish loading, then use the browser's Install app option. A deployed build needs HTTPS for service workers and installation on supported browsers. The Vite development server does not register the service worker.

After the first successful visit, the app shell and routes can open offline. The worker caches only the generated HTML, JavaScript, CSS, manifest, and app icons. It does not cache API responses or cycle records. The current calendar uses in-memory demo records, so edits reset on reload, including offline reloads. New app versions activate after existing app tabs are closed; open forms are not reloaded automatically.

## App structure

- `src/app/` owns routes and the responsive navigation shell.
- `src/pages/` holds route components. Insights and settings remain placeholders for later issues.
- `src/features/periods/` holds calendar date helpers, form validation, and the async `PeriodRepository` contract.
- `src/styles/` holds the shared theme and responsive styles.
- `src/models/` contains the team's shared data models.

The app shell is separate from feature content. The calendar uses a mock `PeriodRepository` with synthetic records; entries are held in memory and reset on reload. Annifa's IndexedDB storage functions or a future server client can implement the same interface and be injected into `CalendarPage` without changing its UI. No health data is sent to a server by this scaffold.

The shared `PeriodRecord` type is used by the calendar. `Mood` and `Energy` definitions were added to the existing model types so the frontend can typecheck that import. The separate `src/models/validation.ts` work is still in progress; it is not used by this calendar form. Once it is complete, its validators can replace the local period form checks.
