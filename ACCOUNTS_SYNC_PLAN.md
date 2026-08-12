# Accounts Sync (mobile ⇄ extension) — execution plan

Sync selected accounts + their keys between the Ambire mobile app and the browser extension via
animated QR codes. Two entry points: the onboarding flow of a freshly installed product, and the
"Sync with mobile / Sync with extension" action of a product already in use.

Every step below ends with a **confirmation gate** — nothing from the next step starts before the
human confirms the previous one (code + screen).

---

## Locked decisions

| Topic | Decision |
|---|---|
| Transport | Animated UR QR (`@ngraveio/bc-ur`), reusing `AnimatedQrCode` (native + web) and `QrScannerWithPermission` (native + web) |
| Crypto | The payload carries the exporter's `keystoreSecrets['password']` entry (salt + scryptParams + AES-GCM wrapped mainKey) plus privKey/seed ciphertexts **as stored**. Importer: `scrypt(password, salt)` → unwrap mainKey → decrypt → re-encrypt under its **own** mainKey. Plaintext key material never enters a QR |
| Secrets exported | `password` only. `biometrics` / email-vault secrets are device-bound and excluded |
| Seeds | Seeds referenced by exported keys (`meta.fromSeedId`) travel as encrypted payloads |
| External keys | All external key records (`ledger`, `trezor`, `lattice`, `qr`, `nfc`) are exported as-is; signing support on the target platform is not filtered |
| View-only accounts | Selectable and exported (address + preferences only) |
| Post-import landing | Account personalize screen, in both the onboarding and the in-use case |
| Logic placement | `KeystoreController` (key/seed/secret material) + `AccountsController` (account records), orchestrated by one `MainController` method per direction |

## Assumptions (flag if wrong)

1. Account metadata (addresses, labels, creation data) travels **readable** inside the payload; only
   privKeys and seeds are ciphertext. Encrypting metadata too is possible but pointless-ish — it would
   ride the same mainKey and only costs an extra pass.
2. Exporting device does not need to be unlocked (we ship stored ciphertexts, not decrypted data).
   The screens are behind an unlocked app anyway.
3. The exported payload reaches the exporting UI through the existing one-time-data channel
   (`ui.message.sendUiMessage` → `receiveOneTimeData`), not through persisted controller state.
4. An exporter with no `password` secret (biometrics-only, if it exists) blocks export with a plain
   message. To be verified in Step 1.
5. Duplicate handling relies on existing semantics: `keystore.addKeys` / `addKeysExternallyStored`
   skip existing `addr+type`, `accounts.addAccounts` merges `associatedKeys` and keeps the
   already-stored preferences (exporter labels do **not** overwrite importer labels).
6. The get-started screens keep their current buttons; "Already an Ambire user" is **added** below
   them (designs show it in place of "Watch an address" — confirm).

---

## Step 1 — Payload format + pure lib (`src/ambire-common`)

`src/ambire-common/src/libs/accountsSync/accountsSync.ts` + types in
`src/ambire-common/src/interfaces/accountsSync.ts`.

**Done.** `src/ambire-common/src/libs/accountsSync/accountsSync.ts` (+ test) — one type, two functions,
no new interfaces file, all four payload fields reuse existing types verbatim:

- `AccountsSyncPayload` v1: `{ v: 1, secret, accounts, keys, seeds }` — `secret` is the `password`
  `MainKeyEncryptedWithSecret` entry, `accounts` are `Account[]`, `keys` are `StoredKey[]`, `seeds`
  are `StoredKeystoreSeed[]`. No `from` field: the importing product always imports from the other one.
- `serializeAccountsSyncPayload` (JSON → UTF-8 → hex, carried as the UR `cbor` field, UR type
  `ambire-account-sync`; we own both ends, so real CBOR buys nothing) and
  `parseAccountsSyncPayload` (explicit validation, no regex; GCM checks reuse the keystore lib's
  `tryParseGcmPayload`). Legacy AES-CTR payloads are rejected — the keystore migrates them on unlock,
  and the app must be unlocked to reach the export screen.
- Measured sizes (real Ambire v2 `creation.bytecode` is only 246 chars, so dropping it saves ~20% and
  is **not** worth a recompute+verify path): 1 acc = 1.9 KB, 5 = 6.5 KB, 10 = 12.4 KB. At the current
  200 B fragments that is 62 frames for 10 accounts (~19 s/loop), so the animated QR runs at ~400 B
  fragments (31 frames, ~9 s at 300 ms) — a display parameter tuned on device in Steps 5/8, not lib logic.

Verified: 13 tests pass, `type:check` clean for the new files, eslint clean.

## Step 2 — KeystoreController export/import

**Done.** `exportForSync` + `importFromSync` on the KeystoreController, next to the existing
single-key `exportKeyWithPublicKeyEncryption` / `importKeyWithPublicKeyEncryption` pair.

- `exportForSync(keyAddrs)` → `{ secret, keys, seeds }`, all read straight from the private fields,
  nothing decrypted (so it works locked). Seeds are the ones referenced by the exported keys'
  `meta.fromSeedId`. Refuses with a plain message when the device has no `password` secret.
- `importFromSync(payload, password)` → `deriveSecret` → unwrap the other device's main key →
  decrypt seeds and privKeys → hand them to the existing `#addSeed` / `#addKeys` /
  `#addKeysExternallyStored`, which re-encrypt under the local main key. Wrong password reuses the
  existing `Incorrect password. Please try again.` path (silent, no crash report).
- Deliberately **not** `withStatus`-wrapped and lets errors propagate — MainController owns the
  status and must not add accounts if this fails (Step 3).
- Reuse instead of new code: extracted `decryptMainKeyWithSecret` into `libs/keystore` (the exact
  inverse of the existing `encryptMainKeyWithSecret`) and made `#unlockWithSecretGCM` use it too, so
  the unwrap + wrong-password mapping exists once.
- `#addSeed` now takes an optional `id` and returns the stored id, so a synced seed keeps the id it
  had on the other device and the synced keys' `meta.fromSeedId` keeps resolving. Its
  locked-keystore behaviour is untouched; the onboarding queueing lives in `#storeSyncedSeed`.
- Onboarding case: new `#seedsToAddOnKeystoreReady` queue next to the two existing key queues.

**Bug found and fixed on the way:** the `isReadyToStoreKeys` setter fired `#addKeys` and
`#addKeysExternallyStored` in parallel `void` calls, and both write the whole `keystoreKeys` storage
entry — so whichever finished last dropped the other's keys. No existing flow queued both at once;
syncing does. Both (plus seeds) now flush sequentially through `#addQueuedKeysAndSeeds`, which also
clears the queues and reports failures via `emitError` instead of leaving an unhandled rejection.

Verified: 7 new tests in `keystore.test.ts` (export shape + no plaintext key in the payload,
selection filtering, import into a device that already has a password, import before the password is
set, double sync doesn't duplicate, no-password export refusal, wrong password imports nothing).
Suite: 33 passed, 1 pre-existing failure (`should remove key`, fails identically on HEAD).

## Step 3 — AccountsController + MainController orchestration

- `AccountsController.getAccountsForSync(addrs)` → the account records to ship (slimmed per Step 1).
- `MainController.exportAccountsForSync({ addrs })` — pulls accounts + keystore material, builds the
  payload, sends it over the one-time-data channel.
- `MainController.importAccountsFromSync({ payload, password })` — `keystore.importFromSync` first,
  then `#updateAccounts({ accountsToAdd })` so the accounts show as `newlyAdded` for the personalize
  screen. Single failure path: nothing is persisted if the password is wrong.

Verify: `yarn extension:type:check-new`; controller test for the orchestration order; manual dispatch
from both the extension background and the mobile WebView worker (generic `method` dispatch, no
per-action wiring needed).
**Gate.**

## Step 4 — Shared UI pieces (`src/common`)

- `useAccountsSyncExport` — selection state, dispatch, one-time-data listener, UR frames.
- `useAccountsSyncImport` — scanner payload → password → dispatch → navigation.
- `SelectAccountsToExport` list (select-all + per-account rows with label, address, balance).
- `SyncPasswordModal` ("Verify mobile password" / "Verify extension password" wording by direction).
- Reuse `AnimatedQrCode` for display and `QrScannerWithPermission` for scanning on both platforms.
- Every string through `t()`, colors from `useTheme()`, spacings from `spacings`, flex from `flexbox`.

Verify: type check + lint; components rendered from a throwaway screen.
**Gate.**

## Step 5 — Extension export ("Sync with mobile" → Export to mobile)

Screens 1 → 3 → 4 → 5 of the extension design: `AccountSelectScreen` gets a "Sync with mobile"
button next to "Add account" → bottom sheet with **Export to mobile** / **Import from mobile** → sync
page with the two cards (store badges + hidden QR placeholder "Click to select address and show QR
code") → select-accounts modal → looping QR with "N accounts selected. Edit your selection".

**Gate (screen review).**

## Step 6 — Extension import, app already in use

Bottom sheet → **Import from mobile** → camera scan (reuse the existing `qrPermission` /
`QrCameraPermissionPage` route) → "Verify Mobile Password" modal → account personalize → dashboard.

**Gate.**

## Step 7 — Extension onboarding import

`GetStartedScreen` → "Already an Ambire user" → 2-slide carousel ("Sync from Ambire mobile") →
scan → "Verify Mobile Password" → **Set extension password** → account personalize → dashboard.
New route(s) under `ONBOARDING_WEB_ROUTES`; the post-password part of onboarding stays untouched.

**Gate.**

## Step 8 — Mobile export ("Sync with extension" → Export to extension)

Mobile `AccountSelectScreen` gets the "Sync with extension" button → bottom sheet (Export /
Import) → explanation sheet (get-extension link + warning) → select-accounts sheet → animated QR
sheet with "N accounts selected. Edit your selection".

**Gate.**

## Step 9 — Mobile import, app already in use

Bottom sheet → **Import from extension** → camera scan → "Verify Extension Password" → account
personalize → dashboard.

**Gate.**

## Step 10 — Mobile onboarding import

`GetStartedScreen` → "Already an Ambire user" → 2-slide carousel ("Import from extension") →
"Scan QR code" screen → password → set device password (existing keystore setup + biometrics) →
account personalize → dashboard.

**Gate.**

## Step 11 — Hardening pass

- Wrong password, partially scanned / abandoned QR (decoder reset + retry), payload version mismatch,
  selection of 0 accounts, account already present on the importer, key already present, seed already
  present, external-key-only account, view-only account.
- Scanner/camera and QR interval cleanup on unmount; no plaintext key material logged anywhere; no
  sensitive data in public controller state.
- `yarn extension:type:check-new`, `yarn lint:fix`, ambire-common jest suite, LavaMoat policy
  regeneration only if dependencies change (none expected — bc-ur is already used).
- Manual matrix: extension→mobile and mobile→extension, each in the onboarding and in-use case.

**Gate: feature complete.**

---

## Security notes to keep in review

- The QR blob is offline brute-forceable against a single password; `scrypt` N=131072 is the only
  cost barrier. Both designs already warn "Your QR code includes sensitive information".
- The exporter's real mainKey is briefly reconstructed in the importer's memory. It is used only to
  decrypt, never persisted, and dropped after the re-encrypt pass.
- Nothing in this flow writes to the exporting device; export is read-only.
