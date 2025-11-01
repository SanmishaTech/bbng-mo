# Repository Guidelines

## Project Structure & Module Organization
This Expo Router app is driven from `app/`, which holds route groups like `(tabs)/`, feature folders such as `modules/`, and auth flows in `login.tsx`. Shared UI primitives live in `components/`, styled with tokens from `theme/` and `tamagui.config.ts`. Context providers and service wrappers sit in `contexts/` and `services/`, with supporting hooks in `hooks/`, validation schemas in `schemas/`, and reusable values in `constants/`. Client configuration (`config/api.ts`) centralizes API targets, while static assets belong under `assets/` and `images/`. Build artifacts in `dist/` are generated—never hand-edit them.

## Build, Test, and Development Commands
- `npm install` — install Node modules after cloning or pulling changes.  
- `npm run start` — launch Expo Dev Tools for local web, iOS, or Android previews.  
- `npm run android` / `npm run ios` / `npm run web` — open the dev build directly on the chosen platform.  
- `npm run lint` — run ESLint with the Expo config; use `--fix` locally before committing.  
- `npm run build:android:preview` / `npm run build:ios:preview` — trigger EAS build scripts defined in `scripts/` for distribution testing.  
- `npm run reset-project` — revert to the starter layout; avoid running on active feature branches.

## Coding Style & Naming Conventions
Use TypeScript for all modules and prefer named exports for reusable components. Maintain two-space indentation and keep JSX attributes on separate lines when they exceed 80 characters. Absolute imports via the `@/` alias should reference top-level folders (e.g., `@/components/Button`). Follow the patterns enforced by `eslint.config.js`; fix lint issues rather than suppressing them. Leave debug `console.log` statements wrapped in `__DEV__` guards or remove them before opening a PR.

## Testing Guidelines
Automated tests are not yet wired into the npm scripts; when adding coverage, colocate Jest or Testing Library specs beside the feature (`FeatureName.test.tsx`) and document any new script additions in `package.json`. Until a unified test runner lands, provide clear manual QA steps in the PR, including the Expo route exercised, credentials used (if any), and expected UI states. Keep validation logic reusable by centralizing schema changes in `schemas/`.

## Commit & Pull Request Guidelines
Commit history is currently inconsistent; adopt Conventional Commit prefixes (`feat:`, `fix:`, `chore:`) followed by a concise imperative summary. Keep changes scoped—split refactors and feature work. PRs must include a plain-language description, screenshots or screen recordings for UI updates, and links to tracking issues or Linear tickets. Request reviews from owners of affected modules (`contexts/`, `services/`, etc.) and confirm `npm run lint` passes before seeking approval.

## Security & Configuration Tips
Never hardcode secrets in source files. Rely on Expo environment variables (`EXPO_PUBLIC_*`) and update only `config/api.ts` when pointing at new backends. Validate any new API contract through the Zod schemas in `schemas/` to prevent runtime failures. Remove unused assets to keep bundles lean, and confirm that any new native modules are supported by the current Expo SDK version listed in `package.json`.
