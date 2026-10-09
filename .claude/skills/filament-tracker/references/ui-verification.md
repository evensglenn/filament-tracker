# Checking a change in a real browser

Type checks and unit tests don't catch layout and interaction bugs; most UI problems in this project were found by clicking through the running app.

**Lasting checks go in the repo**: `e2e/*.spec.ts`, run with `npm run test:e2e` (Playwright, installed Chrome, projects `phone` 390 px and `desktop` 1280 px). `e2e/fixtures.ts` gives each test its own fresh account with a seeded inventory (`signedIn` fixture), plus `headerAction()` (☰ menu on phones, icons on desktop) and `card()`.

**One-off looks** (screenshots to judge a design, comparing variants) are better as a throwaway script in your scratchpad, against the running `dev:local` on http://127.0.0.1:5180. The snippet below is for that. In the scratchpad, `import { chromium } from 'playwright'` needs `npm i playwright` there once; point it at the system Chrome instead of downloading browsers.

## Signing in against the emulator

```js
import { chromium } from 'playwright';

const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 800 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => m.type() === 'error' && errors.push(m.text()));

await page.goto('http://localhost:5180/');
await page.waitForTimeout(1500);                       // let Vite load before clicking
const [popup] = await Promise.all([page.waitForEvent('popup'), page.getByText('Log in met Google').click()]);
await popup.waitForLoadState();
await popup.waitForTimeout(500);                       // clicking too early in the emulator popup silently fails
await popup.getByText('test@example.com').first().click();
await page.getByText('Jadewit').first().waitFor({ timeout: 20000 });
```

If a run times out on sign-in, suspect the script timing first (the popup or Vite not ready yet), not the app.

## Useful checks
- **Widths**: 360 and 390 (phones) and 1280 (desktop). Check `document.documentElement.scrollWidth - innerWidth === 0` for overflow and that the `h1` isn't truncated.
- **Phone actions** are in the ☰ menu: `getByRole('button', { name: 'Menu', exact: true })`, then `getByRole('menuitem', { name: 'Registreer print' })`.
- **Dialogs** animate out for about 0.5 s; wait before asserting that `getByRole('dialog')` is gone.
- **Errors**: `ctx.setOffline(true)` makes writes fail fast; expect a `role="alert"` toast and the dialog to stay open with its input.
- **Sharing**: stub it in `addInitScript` (`navigator.canShare = () => true; navigator.share = async ({ files }) => { window.__shared = … }`) to capture the PNG, or set `navigator.canShare = undefined` and expect a `download` event.
- **Look at the screenshots** (`page.screenshot`) yourself, especially overlays, toasts and menus at phone width.

Testing against the owner's running instance is fine (it is test data), but don't write data they might be looking at without reason, and don't start a second dev server next to theirs.
