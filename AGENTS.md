# Repository Guidelines

## Project Structure & Module Organization
- `src/main.js`: Electron main process; app boot, IPC, DB init.
- `src/preload.js`: Safe bridge APIs exposed to renderer (contextIsolation on).
- `src/renderer/`: UI (HTML/CSS/JS). Tailwind and Chart.js used via CDN.
- `src/services/`: Importers and managers (e.g., `ExcelImporter.js`, `FamilyServiceManager.js`).
- `src/database/`: `DatabaseManager.js` reads `database-schema.sql`; ensures tables/indexes.
- `database/migrations/`: SQL migration files; keep idempotent.
- `docs/`: Architecture, API, and feature docs.
- `data/`: Local SQLite used by scripts (`data/patients.db`).
- `assets/`: Packaging assets (e.g., `assets/icon.ico`). Create if missing.

## Build, Test, and Development Commands
- `npm start`: Launch Electron app.
- `npm run dev`: Launch with devtools (`--dev`).
- `npm run build`: Package app (electron-builder). Use `npm run build-win` on Windows.
- `npm test`: Run Jest unit tests (if present).
- `node test-age-logic-fix.js`: Example ad‑hoc integration check.
- `node fix-names.js`: Example maintenance script.

## Coding Style & Naming Conventions
- Indentation: 2 spaces; include semicolons; prefer `const`/`let`.
- Naming: camelCase for variables/functions; PascalCase for classes and class-like files in `src` (e.g., `DatabaseManager.js`); kebab-case for root scripts (e.g., `fix-parent-names.js`).
- Renderer access only via `preload` APIs; do not enable `nodeIntegration`.
- No linter configured; match existing style and file layout.

## Testing Guidelines
- Unit: Place Jest tests under `src/**/__tests__` or `*.test.js`; run with `npm test`.
- Integration/diagnostics: Keep `test-*.js` scripts in repo root; run with `node <file>`.
- Aim to cover new business logic (>80% where practical). Prefer deterministic tests against a temp DB.

## Commit & Pull Request Guidelines
- Commits: Follow Conventional Commits (e.g., `feat(patients): add detail view`, `fix(ui): restore script include`). Keep messages concise; use English or Chinese consistently.
- PRs: Provide summary, motivation, and screenshots for UI changes. Link issues, list test steps, and note DB/migration impacts. Keep changes focused.

## Security & Configuration Tips
- Secrets/keys: Do not commit credentials; local SSH keys are gitignored.
- Database paths: Runtime DB lives under Electron `userData`; CLI scripts default to `./data/patients.db`.
- Packaging: Ensure `assets/icon.ico` exists and update `build` config if paths change.
