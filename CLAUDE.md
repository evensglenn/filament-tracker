# Filament tracker

## Versioning
- Bump `version` in `package.json` (semver) in **every** change that gets merged: patch for fixes, minor for new features or visible changes, major for breaking changes such as a data migration. Keep `name`/`version` in `package-lock.json` in sync.
- The footer shows this version (`__APP_VERSION__`, injected by `vite.config.ts`), so never hard-code it.

## Checks before a PR
- `npx tsc --noEmit`, `npm test` and `npm run build`.
- For changes to Firestore code or `firestore.rules`: `npm run test:emulator` (needs Java 21+).

## Deploy
- A push to `main` deploys the Firestore rules first and then the app to GitHub Pages (`.github/workflows/deploy.yml`).
