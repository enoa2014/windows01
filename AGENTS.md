# Repository Guidelines

This document is a quick, practical guide for contributors working on the Electron-based 患儿入住信息管理系统. Keep changes focused, align with existing patterns, and reference this file when in doubt.

## Project Structure & Module Organization
- `src/main.js`: Electron main process (app bootstrap, IPC, DB init).
- `src/preload.js`: Safe bridge APIs (contextIsolation enabled).
- `src/renderer/`: UI (HTML/CSS/JS). Tailwind & Chart.js via CDN; pages like `index.html`, `patient-detail-*.html` and `js/app.js`.
- `src/services/`: Data import/managers (`ExcelImporter.js`, `FamilyServiceManager.js`).
- `src/database/`: DB helpers; schema in root `database-schema.sql`.
- `database/migrations/`: Idempotent SQL migrations.
- `docs/`: Architecture, API, and feature docs.
- `data/`: Local SQLite for CLI tools (e.g., `data/patients.db`).
- `assets/`: Packaging assets (e.g., `assets/icon.ico`).

## Build, Test, and Development Commands
- `npm start`: Launch the Electron app.
- `npm run dev`: Launch with devtools (`--dev`).
- `npm run build` / `npm run build-win`: Package app with electron-builder.
- `npm test`: Run Jest tests.
- Utilities: `node test-age-logic-fix.js`, `node fix-names.js` (ad‑hoc checks/maintenance).
- Optional: `npm run analyze-xls` → summarize `2024.xls` to `docs/2024-xls-structure.md`.

## Coding Style & Naming Conventions
- Indentation 2 spaces; always use semicolons; prefer `const`/`let`.
- Naming: camelCase (vars/functions), PascalCase (classes and class-like files in `src`, e.g., `DatabaseManager.js`), kebab-case for root scripts (e.g., `fix-parent-names.js`).
- Renderer may only access Node through preload APIs; keep `nodeIntegration` disabled.
- No linter configured—match existing style and layout.

## Testing Guidelines
- Framework: Jest. Place tests in `src/**/__tests__` or `*.test.js`.
- Integration/diagnostics: root `test-*.js` scripts (`node <file>` to run).
- Target >80% coverage for new business logic; write deterministic tests (use a temp SQLite DB).

## Commit & Pull Request Guidelines
- Commits: Use Conventional Commits (e.g., `feat(patients): add detail view`, `fix(ui): restore script include`). Be concise; use English or Chinese consistently.
- PRs: Provide summary/motivation; link issues; include screenshots for UI changes; list test steps; call out DB/migration impacts. Keep diffs focused.

## Security & Configuration Tips
- Never commit credentials; local SSH keys are gitignored.
- Database: runtime DB under Electron `userData`; CLI scripts default to `./data/patients.db`.
- Packaging: ensure `assets/icon.ico` exists; update the `build` section if paths change.
