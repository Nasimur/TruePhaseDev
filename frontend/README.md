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

## Install and offline use

The production build includes a web app manifest, 192 px and 512 px icons, and a service worker. To check it locally:

```sh
npm run build
npm run preview
```

Open the preview URL on `localhost` or `127.0.0.1`, allow the first visit to finish loading, then use the browser's Install app option. A deployed build needs HTTPS for service workers and installation on supported browsers. The Vite development server does not register the service worker.

After the first successful visit, the app shell and routes can open offline. The worker caches only the generated HTML, JavaScript, CSS, manifest, and app icons. It does not cache API responses or cycle records. Period records live in IndexedDB, separately from the service worker cache, so they remain available after online and offline reloads.

### Updates

Each build generates `dist/sw.js` with a cache name derived from the list of built files. When a new version is deployed, the browser installs the new worker in the background, and it takes over once every open TruePhase tab or installed window is closed. Open forms are never reloaded automatically. The new worker deletes older `truephase-shell-*` caches when it activates. It never touches IndexedDB.

### Limitations

- Service workers need HTTPS, or `localhost` during development. `npm run dev` does not register the worker; use `npm run build` and `npm run preview` to test offline behaviour.
- The app works offline only after one complete online visit.
- Install prompts vary by browser. Chromium browsers show an Install option, and iOS Safari uses Share → Add to Home Screen. Firefox desktop does not install PWAs.
- Browsers can evict site data under storage pressure, and private or incognito windows discard it when closed. IndexedDB is not a backup.

### Recovery

If the app shows a stale or broken version, open the browser's site settings or DevTools (Application → Service workers), unregister the worker, and reload. To reset only the app shell, clear the cache storage for the site and keep site data. Clearing all site data also deletes your stored period records.

## App structure

- `src/app/` owns routes and the responsive navigation shell.
- `src/pages/` holds route components. Insights and settings remain placeholders for later issues.
- `src/features/periods/` holds calendar date helpers, form validation, IndexedDB persistence, and the async `PeriodRepository` contract.
- `src/styles/` holds the shared theme and responsive styles.
- `src/models/` contains the team's shared data models.

Period records are stored in this browser's IndexedDB database and remain available after reloads. Browser storage can be cleared and is not an encrypted backup; avoid using a shared device for sensitive entries. Period data is not sent to a server.

The shared `PeriodRecord` type is used by the calendar. `Mood` and `Energy` definitions were added to the existing model types so the frontend can typecheck that import. The separate `src/models/validation.ts` work is still in progress; it is not used by this calendar form. Once it is complete, its validators can replace the local period form checks.
