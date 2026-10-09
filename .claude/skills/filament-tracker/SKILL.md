---
name: filament-tracker
description: How to work on the Filament tracker app (React + Vite + Firebase, deployed to GitHub Pages) the way its owner wants - the change → verify → version → PR → merge → deploy workflow, the data model, UI conventions and the owner's design preferences, and known pitfalls. Use this for every task in this repository - new features, bug fixes, design tweaks, Firestore rules or data changes, running or testing the app locally, deploys and failing GitHub Actions - even when the request is a one-liner like "maak die knop kleiner" or "commit en merge".
---

# Filament tracker

A personal 3D-printing filament inventory: spools per type and color, prints subtract grams, deliveries add spools, and a shareable image of your types and colors. One user (the owner) on several devices; the UI is Dutch. Talk to the owner in Dutch.

For the data model and where things live, read `references/architecture.md`. For how to check a change in a real browser, read `references/ui-verification.md`. For what was already decided (and declined), read `references/decisions.md` before proposing features.

## Workflow for every change

The owner tests everything in the browser before it goes live, and expects it to just work when they look. So:

1. **Branch** from an up-to-date `main` (`git checkout main && git pull`, then `feat/…`, `fix/…` or `chore/…`). Never commit to `main` directly; it is protected against force-push and deletion.
2. **Make the change**, matching the surrounding code (Tailwind classes inline, small components, comments that explain *why*).
3. **Bump the version** in `package.json` and in `package-lock.json` (`name`/`version` at the top and in `packages[""]`): patch for fixes, minor for new or visible changes, major for breaking ones like a data migration. One bump per merged PR; if the branch already has an unmerged bump, keep it. The footer shows this version, so never hard-code it.
4. **Check**: `npx tsc --noEmit`, `npm test`, `npm run build` and `npm run test:e2e` (Playwright in `e2e/`; it reuses a running `dev:local`). For anything touching Firestore code or `firestore.rules`, also `npm run test:emulator`. When you add or change behavior, add or update a browser test for it in `e2e/` (see `e2e/fixtures.ts`).
5. **Look at it**: drive the running app with a browser (see `references/ui-verification.md`) at phone width (360 and 390 px) *and* desktop (1280 px), and look at the screenshots yourself. Many real bugs in this project were only visible this way (a toast covering the confirm button, a menu tap also opening the card below, a header overflowing at 360 px).
6. **Restart the local server** so the owner can try it right away on http://localhost:5180 (see below). The owner asked for this after every change.
7. **Report** what changed, what you verified and what you could not verify (e.g. the share sheet on a real iPhone), then ask whether to commit and merge. Don't commit or merge unasked; the owner answers with things like "commit en merge" or "ja".
8. **Commit, PR, merge, watch the deploy** when asked: commit message `type: Summary (vX.Y.Z)` with a short body, PR with Summary and Testing checklist. Wait for the CI check on the PR (`gh pr checks --watch`; `.github/workflows/ci.yml` runs types, unit, Firestore and browser tests) and only merge when it is green, then `gh pr merge --merge`, `gh run watch` on the deploy run, and report the result.

## Running locally

```bash
npm run dev:local     # emulators + test data + app on http://localhost:5180
```

Sign in with **Test** (test@example.com) in the emulator's Google popup; the seed (`scripts/seed-emulator.mjs`) gives 11 spools, two nearly empty, some recently printed. Data is gone after stopping. `npm run dev` runs against the **real** database, so avoid it for testing.

To restart it for the owner: stop whatever listens on 5180, 8080, 9099 (and 4400/4500), then start `npm run dev:local` in the background and confirm "Testdata geladen" and a 200 on :5180. Never start a second instance next to a running one: the emulators then fail with "port taken".

While `~/.npm` contains root-owned files, prefix npm/npx commands with `npm_config_cache="$TMPDIR/npm-cache-ft"` (the owner can fix it with `sudo chown -R 502:20 ~/.npm`).

## Deploy and CI

A push to `main` runs `.github/workflows/deploy.yml`: first the `firestore` job deploys `firestore.rules` and indexes with the `FIREBASE_SERVICE_ACCOUNT` secret, then `deploy` runs the tests, builds and publishes to GitHub Pages. If the rules fail, the app is not deployed, which keeps app and rules in sync.

If "Deploy to GitHub Pages" fails with *No artifacts named "github-pages"* or *Multiple artifacts…*, it is a GitHub glitch, not the code. Don't use "re-run failed jobs": that uploads a second artifact into the same run and then fails on the duplicate. Start a fresh run instead: `gh workflow run deploy.yml --ref main`, and watch that one.

## What the owner likes

These came from direct feedback; follow them unless asked otherwise.

- **Calm and compact.** Icon-only buttons where the icon is clear (share, sort, print in the header), with a `title` and `aria-label`. No big labelled call-to-action buttons; a fixed "Print registreren" bar was rejected as too prominent.
- **Phone first.** On phones the header holds only the title and a ☰ menu with all actions (print, delivery, settings, logout); sorting folds out from a ⇅ button; filters get their own row without horizontal scrolling. Larger screens show the actions inline.
- **One red.** Warnings and destructive actions use the theme colors `danger`, `danger-strong`, `danger-light` and `danger-soft` (`src/index.css`), a deep calm red; never Tailwind's `red-*`, which the owner found too bright.
- **No redundant indicators.** E.g. the active sort shows only its direction arrow, no extra check mark.
- **The filament's color is the star.** Cards have no stock bar or other colored blocks; the swatch is the only color. Low stock is explicit and in grams (`getStockStatus`): "Bijna op" at 250 g or less, "Beperkt" at 500 g or less, each with a filled label, a colored amount and border (red / amber); the card itself stays white. When a design question has several reasonable answers, show the owner the variants side by side (screenshots of the running app) and let them pick.
- **Share image = types and colors only.** No quantities, grams or low-stock marks; a color owned twice shows once. The "Deel" button shares directly (no preview dialog); where sharing files isn't supported it is "Bewaar" (download).
- **Visible feedback.** Failures show a toast at the top ("… is mislukt." + reason); dialogs stay open with the input intact so a retry is one tap.
- **Not wanted** (declined): offline mode, print history, sharing the inventory with other people. See `references/decisions.md`.

## Pitfalls that already bit

- **Fixed overlays inside the header** are confined to the header, because its transform and blur create a containing block. Render backdrops in `<body>` via a portal (see `components/ui/Popover.tsx`).
- **Taps "outside" a menu** must be caught by a backdrop, or they also activate what lies below.
- **Stacking**: the sticky header is `z-40`; page-level popovers must stay below it (backdrop `z-[31]`, and only an *open* popover lifts its button to `z-[32]`), or a toolbar button shows through the open header menu.
- **Number inputs**: `step` counts from `min`, so `min="1" step="50"` makes 1000 invalid. Use `step="any"` for weights.
- **iOS share sheet** only opens right after a tap, so the share image is drawn in advance (`useOverviewImage`) instead of on click.
- **Firestore writes while offline** don't fail; they wait. Write paths call `requireConnection()` to fail fast with a clear message.
- **Remaining grams are an int** (`remainingGrams`); rules reject floats. Round when converting from spools.
- **Ports**: Vite uses a fixed 5180 (`strictPort`) on `127.0.0.1`, because another local app registers a service worker on localhost:5173, and because the owner's browser reaches localhost over IPv4 (Vite's default `::1` only looked fine to `curl localhost`). Check `http://127.0.0.1:5180` after restarting.
- **Homebrew's openjdk@21 is keg-only** (not on PATH); `scripts/emulators.mjs` finds it, so don't tell the owner to change PATH.
