# Architecture

## Stack
React 19 + TypeScript, Vite 6, Tailwind 4, `motion` for animation, `lucide-react` icons, Firebase Auth (Google) and Firestore. Vitest for tests. Hosted on GitHub Pages; Firebase project `gen-lang-client-0254253016` (an AI Studio project) with the **named** database `ai-studio-92b0488e-5b3e-446b-8558-2dc09d3e6617` (see `firebase-applet-config.json`, `firebase.json`).

## Firestore data model (v2)
Everything a user owns lives under `users/{uid}`; rules allow only the owner (`firestore.rules`, schema in `firebase-blueprint.json`).

| Path | Contents |
| --- | --- |
| `users/{uid}` | `types`: filament types, each `{ id, name, brand, presets: [{ id, name, hex }] }`; `migratedAt` (legacy marker, still allowed) |
| `users/{uid}/filaments/{id}` | `typeId`, `brand`, `colorName`, `colorHex`, `remainingGrams` (int, total over all spools), `spoolWeight` (g per full spool), `notes`, `createdAt`, `updatedAt` (server timestamp), `lastUsedAt` (only set by prints) |
| `users/{uid}/prints/{id}` | Append-only log `{ createdAt, items: [{ filamentId, typeId, colorName, colorHex, grams }] }`, written in the same transaction as the usage |

- The UI shows weights only (`formatWeight`); the form edits `remainingGrams` directly. `spoolWeight` is what one tap adds in a delivery.
- A filament refers to its type by `typeId`; renaming a type is one change in settings. Types in use can't be deleted.
- Prints and deliveries run as transactions on the server values (`filamentService.logPrint`, `addSpools`), so two devices can't lose each other's updates.
- The old v1 collections (`filaments`, `userConfigs`, `shares`) were migrated and are closed by the rules.

## Code map
- `src/App.tsx` - wires hooks, header, toolbar, grid and modals.
- `src/hooks/` - `useAuth`, `useAccountSetup` (creates the user doc with defaults), `useFilaments`, `useUserConfig` (debounced saves, flush on close), `useFilamentFilters`, `useOverviewImage` (+ `shareOrSave`, `canShareFiles`), `useHideOnScroll`, `useHashRoute` (pages in the address: `#instellingen`, `#instellingen/<typeId>`, so the back button works).
- `src/services/` - `filamentService` (CRUD, transactions, `requireConnection`, `handleFirestoreError` keeps the Firebase error `code`), `configService` (types; `DEFAULT_BAMBU_TYPES` seed a new account once).
- `src/utils/` - `filaments.ts` (conversions, stock levels, filter/sort, `toInventory` joins type names), `color.ts` (`getHue`, `isLightColor`), `overviewImage.ts` (canvas drawing of the share image), `errors.ts` (`describeError` in Dutch).
- `src/components/` - `Header` (☰ menu on phones), `inventory/` (Toolbar, FilamentGrid, FilamentCard), `modals/` (form, delete, print, delivery), `settings/SettingsPage` (filament types as a page at `#instellingen`, list and editor side by side on large screens), `ui/` (`Modal` with Escape/focus trap/scroll lock, `Popover`, `Toast`, `ColorSwatch`, `FilamentPicker`), `UpdateNotice` ("Nieuwe versie" + Vernieuw: `useUpdateCheck` compares `version.json`, written by a build plugin in `vite.config.ts`, with `__APP_VERSION__` on start, when the app comes back to the front and every 30 minutes; never reloads by itself).
- `scripts/` - `emulators.mjs` (runs dev or tests against the emulators), `seed-emulator.mjs`.

## Tests
- `npm test` - unit tests (`src/**/*.test.ts`); the emulator tests are skipped without emulators.
- `npm run test:emulator` - all tests, including `src/services/firestore.emulator.test.ts` (account setup, transactions, rules). Needs Java 21+.
