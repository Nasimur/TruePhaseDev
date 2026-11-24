# Contributing to TruePhase

Thanks for helping. TruePhase handles sensitive health data, so the privacy rules below are requirements, not suggestions.

## Setup

**Requirements:** Node.js 20.19+ or 22.12+ (CI uses Node 22), npm, and Git.

```sh
git clone https://github.com/Nasimur/TruePhaseDev.git
cd TruePhaseDev/frontend
npm ci
npm run dev
```

Open the URL that Vite prints.

**Other commands, all run from `frontend/`:**

| Command | What it does |
| --- | --- |
| `npm run typecheck` | TypeScript project build (`tsc -b`) |
| `npm test` | Vitest unit tests (IndexedDB is simulated with `fake-indexeddb`) |
| `npm run build` | Production build into `frontend/dist/` |
| `npm run preview` | Serve the production build. Use this to test offline and PWA behaviour, because the dev server doesn't register the service worker. |
| `npm run format` | Prettier |

**Research code (Python)** lives on the `Marcus-Algo` branch under `research/` and has its own README and `requirements.txt`.

## Branches

- Create every branch from the **current `main`**: `git switch main && git pull && git switch -c <branch>`.
- **Name branches by type:**
  - `feat/<short-name>` for features
  - `fix/<short-name>` for bug fixes
  - `chore/<short-name>` for docs, CI and tooling
  - `research/<short-name>` for research work
- Keep pull requests small and focused on one issue.
- **Open pull requests against `main`.** A PR merged into another feature branch is *not* shipped. Don't close an issue until its work is on `main` and verified.

## Before you open a PR

Run these from `frontend/`. They're the same checks CI runs:

```sh
npm run typecheck
npm test
npm run build
```

If you changed the service worker, offline behaviour or storage, also test the production build:

1. Run `npm run build && npm run preview`.
2. Load the app once while online.
3. Stop the preview server and reload. The app should still load and your records should still be there.

## Pull request checklist

Every PR description should include:

- **Linked issue(s)**, for example `Closes #10`. Use `Closes` only if the PR fully completes the issue on `main`.
- **What changed and why.**
- **Migration impact:** any Dexie schema change, and how existing data is preserved. See [docs/DATA_MODEL.md](docs/DATA_MODEL.md#schema-versions-and-migration).
- **Privacy impact:**
  - any new field stored,
  - any new network request,
  - any new dependency that could make network requests.
- **Commands you ran**, and their results.
- **Screenshots** for UI changes, at both mobile and desktop widths.
- **Known limitations.**

Get **at least one peer review** before merging into `main`. CI must pass.

## Privacy rules for code

1. **No health data leaves the device.** Don't add analytics, telemetry, error reporting, remote fonts, CDNs or APIs that receive or could infer user records. Any outbound request needs a privacy review.
2. **The service worker caches static files only.** It must never cache IndexedDB data or API responses.
3. **Collect as little as possible.** New fields need a user-facing reason and a schema review (see ADR-004 in [`plan.md`](plan.md)).
4. **Never commit real health data:**
   - not in fixtures or screenshots,
   - not in research datasets: raw datasets stay in git-ignored `research/data/raw/`.
   - Use synthetic data for tests.
5. **No medical claims.** Predictions are labelled as estimates. Don't suggest the app is suitable for contraception or diagnosis.

## Code conventions

- **TypeScript strict mode** is on, including `noUncheckedIndexedAccess`. Don't silence errors with `any` or `!` unless you leave a comment explaining why.
- **UI depends on repository interfaces**, not on Dexie directly, so components can be tested with an in-memory implementation.
- **Validate at the repository boundary** before writing to IndexedDB, and treat stored data as untrusted when reading it back.
- **Dates are `YYYY-MM-DD` local calendar-day strings.** Use the helpers in `features/periods/dateUtils.ts`, not raw `Date` arithmetic.
- **Tests sit next to the code they test** (`*.test.ts`).
- **Accessibility:**
  - interactive elements need accessible names,
  - forms must work with a keyboard and a screen reader,
  - don't rely on colour alone (recorded and predicted days must differ by more than colour).

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) explains how the pieces fit together.
- [docs/DATA_MODEL.md](docs/DATA_MODEL.md) covers fields, validation, dates and migrations.
- [docs/PREDICTIONS.md](docs/PREDICTIONS.md) covers the prediction approach and research.
- [PRIVACY.md](PRIVACY.md) is what we tell users about their data.
- [plan.md](plan.md) holds the roadmap, owners and acceptance criteria.

Update the relevant doc in the same PR when you change behaviour it describes.
