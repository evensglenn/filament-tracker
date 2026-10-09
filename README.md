# Filament tracker

Voorraadbeheer voor 3D-printfilament: rollen, kleuren, prints en leveringen, gesynchroniseerd tussen al je toestellen via Firebase (Auth + Firestore). Gebouwd met React, Vite en Tailwind en gehost op GitHub Pages.

## Lokaal draaien

Aanbevolen: tegen de Firebase-emulators, met testdata en los van je echte voorraad.

```bash
npm install
npm run dev:local
```

Open http://localhost:5180, klik op **Inloggen met Google** en kies **Test** in het venster van de emulator. Je krijgt een testvoorraad van 11 spoelen; alles wat je doet blijft in de emulator en is weg na het stoppen (Ctrl+C).

Vereist **Java 21+** voor de emulators (`brew install openjdk@21`; het script vindt de Homebrew-installatie ook zonder PATH-aanpassing).

`npm run dev` start de app tegen de **echte** database: handig om iets na te kijken, maar elke wijziging is echt.

## Tests

```bash
npm test               # unit tests
npm run test:emulator  # ook de Firestore-tests (account, transacties, regels) tegen de emulators
```

## Datamodel

Alles van een gebruiker staat onder `users/{uid}`:

| Pad | Inhoud |
| --- | --- |
| `users/{uid}` | Filamenttypes en hun kleurpresets |
| `users/{uid}/filaments/{id}` | Een filament; `remainingGrams` is de voorraad in grammen, `typeId` verwijst naar een type |
| `users/{uid}/prints/{id}` | Printlog (alleen toevoegen) |

De regels staan in [firestore.rules](firestore.rules), het schema in [firebase-blueprint.json](firebase-blueprint.json).

## Deploy

Elke push naar `main` rolt eerst de Firestore-regels en -indexen uit en daarna de app naar GitHub Pages ([deploy.yml](.github/workflows/deploy.yml)). Lukt het uitrollen van de regels niet, dan wordt de app niet gedeployd.

Eenmalige setup voor het uitrollen van de regels:

1. Open in de [Google Cloud Console](https://console.cloud.google.com/iam-admin/serviceaccounts?project=gen-lang-client-0254253016) het project `gen-lang-client-0254253016` → **Service accounts** → **Create service account** (bv. `github-firestore-deploy`).
2. Geef het de rollen **Firebase Rules Admin**, **Cloud Datastore Index Admin** en **Service Usage Consumer**.
3. Open het service account → **Keys** → **Add key** → **JSON** en download het bestand.
4. Zet de inhoud als repository secret `FIREBASE_SERVICE_ACCOUNT`: GitHub → **Settings** → **Secrets and variables** → **Actions**, of `gh secret set FIREBASE_SERVICE_ACCOUNT < key.json`. Verwijder daarna het bestand.
