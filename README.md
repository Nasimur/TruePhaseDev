# TruePhase

A privacy-first, open-source menstrual cycle tracker. It's a progressive web app that works offline, keeps your records on your own device, and will estimate your next period without sending your data anywhere.

> **Status:** alpha development. Period tracking with on-device storage works. Offline install is in review, and daily logs and predictions are in progress. See [plan.md](plan.md).

## Quick start

```sh
cd frontend
npm ci
npm run dev
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for tests, branches and PR guidelines.

## Documentation

| Document | Covers |
| --- | --- |
| [plan.md](plan.md) | Roadmap, owners, acceptance criteria |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | How the UI, storage, service worker and prediction engine fit together |
| [docs/DATA_MODEL.md](docs/DATA_MODEL.md) | Fields, validation, date handling, schema migrations |
| [docs/PREDICTIONS.md](docs/PREDICTIONS.md) | Prediction approach, research results, limitations |
| [PRIVACY.md](PRIVACY.md) | What is stored, what leaves your device, data-loss risks |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Setup, conventions, review expectations |
| [frontend/README.md](frontend/README.md) | Frontend commands and structure |

## Privacy at a glance

- Health records stay in your browser's IndexedDB. There is no account and no server upload.
- Browser storage is **not encrypted and not a backup**. Clearing site data deletes your records.
- Predictions are estimates, not medical advice.
