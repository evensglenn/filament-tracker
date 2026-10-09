# Decisions so far

Read this before proposing features, so you don't re-suggest what was declined or undo what was chosen on purpose. Add a line when the owner makes a new call.

## Done (PRs on GitHub)
- **v2.x** Split the 1400-line `App.tsx` into hooks, services and components (#1). Atomic quantity updates; sharing with other users removed (#2).
- **v3.0** Firestore v2: everything under `users/{uid}`, grams instead of spools, types by id, print log, server timestamps, rules deployed by CI (#3); v1 data migrated and closed (#5). Redesign: calm cards with stock bar, searchable print/delivery lists, bottom sheets on phones (#6).
- **v3.1** Print as a small header icon instead of a big button; logout back in the header (#7).
- **v3.2** Overview became a generated PNG to share, like the owner's `voetbal-scorebord` app (canvas drawing, share sheet or download) (#8).
- **v3.3** `npm run dev:local` with emulators and test data on port 5180; "Deel" button directly in the toolbar; share image with types and colors only (#9).
- **v3.4** Phone header: all actions behind ☰; phone sorting in a ⇅ popover; icon-only share button (#10).
- **v3.5** Visible error messages (toasts at the top), fail fast without connection, dialogs with Escape/focus trap/scroll lock; the header menu covers the toolbar buttons; this skill.

## Declined by the owner
- **Offline mode** (Firestore offline cache, service worker): not needed.
- **Print history / usage statistics**: not needed, even though the print log exists.
- **Sharing the inventory with other accounts**: removed on purpose; the app is single-user.
- **A preview dialog for the share image**: share directly from the button.
- **A "Bewaar" button next to "Deel"**: only one of the two shows, depending on the browser.

## Ideas not done yet (ask before starting)
- Filter chips from the owner's own types instead of the hard-coded PLA/PETG.
- Spool weight per type as a default; a low-stock threshold in grams instead of a quarter spool.
- Offer to add a spool when adding a color that already exists.
- Browser tests in the repo and CI; update GitHub Actions past the Node 20 deprecation; code-split Firebase to shrink the >500 kB bundle.
