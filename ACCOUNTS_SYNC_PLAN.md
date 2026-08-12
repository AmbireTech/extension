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

**Done.** The UI contract for Steps 4-10:

- `AccountsController.getAccountsForSync(addrs)` → the selected `Account` records, preferences and
  all (one-line filter; the accounts are shipped whole, per Step 1).
- `MainController.exportAccountsForSync(addrs)` — resolves the accounts, derives the key addresses
  from their `associatedKeys`, calls `keystore.exportForSync`, serializes and sends the result to the
  UI as `sendUiMessage({ accountsSyncPayload })` (the existing one-time-data channel, so the payload
  never lands in persisted controller state). Refuses an empty selection.
- `MainController.importAccountsFromSync({ payload, password })` — `payload` is the hex string the UI
  assembled from the scanned QR codes, `password` is the *other* device's password. Parses (invalid
  data → plain-language error, no jargon), then `keystore.importFromSync` **before**
  `#updateAccounts`, so a wrong password adds neither keys nor accounts. Imported accounts land as
  `newlyAdded`, which is what the personalize screen renders.
- Both are `withStatus`-wrapped (`exportAccountsForSync` / `importAccountsFromSync` added to the main
  `STATUS_WRAPPED_METHODS`), so the UI gets loaders and double-submit protection. No background or
  per-action wiring needed - the extension background and the mobile worker both dispatch `method`
  generically.

Verified: new `mainAccountsSync.test.ts` (5 tests, two full device-to-device round trips through both
controllers): export of a subset, signer works on the importing device, preferences travel, onboarding
order (import → set password → keys land), wrong password imports nothing, non-Ambire QR data imports
nothing, empty selection exports nothing. `accounts.test.ts` still green.

## Step 4 — Shared UI pieces (`src/common/modules/accounts-sync`)

**Done.** Everything the platform screens need, and nothing platform specific:

- `useAccountsSyncExport` — selection state (`toggleAccount`, `toggleAllAccounts`, `areAllSelected`)
  and `prepareExport`, which awaits the payload and exposes it as `qrCbor` for `AnimatedQrCode`.
  Changing the selection discards the payload, so stale QR codes can't be shown.
- `useAccountsSyncImport({ onImported })` — `handleScanComplete(bytes)` parses the scanned data with
  the Step 1 lib, so a foreign QR code is rejected **before** the password is asked for (and the UI
  knows how many accounts are coming); `importScannedAccounts(password)` awaits the import and then
  calls `onImported`.
- `SelectAccountsToSync` — select-all + one row per account, reusing the existing account row
  (`modules/account-select/components/Account`) so labels, badges, key icons and balances look
  exactly as everywhere else.
- `consts.ts` — QR fragment capacity (400) and the import timeout.

Reuse instead of new code, three small existing-code changes:
- Both hooks await results through the existing `dispatchAndWait` (requestId + one-time-data channel)
  instead of a bespoke listener; the main controller methods gained an optional trailing `requestId`
  and reply through it. This also sidesteps relying on the transient `SUCCESS` status, which mobile
  can collapse.
- `dispatchAndWait` got an optional `timeoutMs` (default stays 10s): deriving the other device's main
  key runs scrypt, which can take longer than that on a low end device.
- `AnimatedQrCode` (native + web) got an optional `capacity` prop, default unchanged at 200, so the
  hardware wallet signing flows are untouched while sync uses 400 byte fragments.
- The account row got `switchAccountOnPress` (default `true`): in the sync list a press ticks the row
  instead of switching the selected account.
- No password component was written — the existing `PasswordConfirmation` already supports
  `onCustomSubmit` + a custom title, and it renders the keystore's `errorMessage`, which is exactly
  where the wrong-password error for the other device's password lands.

Verified: `yarn extension:type:check-new` → 0 new errors, eslint clean on the new module.

**Note for the review:** all five existing `isSelectable={false}` call sites (accounts settings,
recovery phrases, saved seed phrases sheets) still switch the selected account when a row is pressed,
which looks unintended. Left as is — out of scope.

## Step 5 — Extension export ("Sync with mobile" → Export to mobile)

**Done.** Screens 1 → 3 → 4 → 5 of the extension design:

- `AccountSelectScreen` footer now holds two buttons: "Sync with mobile" (secondary) next to
  "Add account" (primary).
- `SyncBottomSheet` (in `common`, so the mobile app reuses it in Step 8) — asks for the direction
  only, with **Export to mobile** / **Import from mobile** options. The wording flips by platform and
  what each option does is passed in, because the extension navigates to a page while mobile opens
  another sheet.
- `SyncWithMobileScreen` (`syncWithMobile` route, tab only, authenticated + unlocked) — the two
  numbered cards. The QR card starts as a hidden placeholder ("Click to select accounts and show QR
  codes") that opens the select-accounts modal; after Confirm the animated QR loops with
  "N accounts selected. Edit your selection".
- The import option is wired to a TODO placeholder until Step 6.

**Assets, all converted from the delivered files (mechanically, by script - no path data typed by
hand) and all theme driven, so they follow a theme change like every other icon:**
- `SyncIcon` - the sync glyph on the "Sync with mobile" button (`#0D0E0F` → `theme.primaryText`,
  overridable with a `color` prop).
- `AppStoreBadgeIcon`, `GooglePlayBadgeIcon` - single color art, so `#0D0E0F` → `theme.primaryText`,
  which makes them white on the dark theme instead of invisible. Rendered as **labels only**; they
  become pressable once the store listings are live.
- `SyncDevicesIcon` - the sheet illustration. Its three design greys map 1:1 to theme tokens
  (`#808EA2` → `neutral600`, `#F2F4F7` → `secondaryBackground`, `white` → `primaryBackground`).
- `assets/images/how-to-sync-on-mobile.png` - the phone mockup on the download card.
- `modules/accounts-sync/animations/syncStepsOnTheExtension.json` - the delivered Lottie (480x598,
  ~910KB, 62 base64 WebP frames embedded, so it is self contained). Wired in Step 10; **needs an
  on-device check** that `lottie-react-native` renders the embedded frames, and the file size is
  worth a second thought since it ships in the bundle.

**Still needed** (both marked with TODOs in `SyncFromMobileScreen`, where the illustrations are
currently empty):
1. The animation (or image) of the **steps on the mobile app** - the mirror of the Lottie we have for
   the steps on the extension. Used by the extension's import steps.
2. The illustration of the **QR codes on the other device's screen**, for the second step (the design
   shows a QR picture with the "Your QR code includes sensitive information" header). Needed in both
   directions, so a mobile-facing and an extension-facing version if they differ.

Verified: `yarn extension:type:check-new` → 0 new errors, eslint clean (the two errors in
`AccountSelectScreen` are pre-existing: an unused `Pressable` import and `selectedAccountIndex`).

**Gate (screen review).**

## Step 6 — Extension import, app already in use

**Done.** `SyncFromMobileScreen` (`syncFromMobile` route): the computer's camera scans the phone's QR
codes, then the "Verify mobile password" modal takes the **other** device's password and the imported
accounts land on the personalize screen.

- The scan reuses `QrScannerWithPermission` (web), which already assembles the animated UR fragments
  and hands over the finished payload; the Step 4 hook validates it before the password is asked for.
- The password step reuses `BottomSheetPasswordConfirmation` + `PasswordConfirmation` in its existing
  `onCustomSubmit` mode. Both gained three passthrough props (`children` for the design's note under
  the field, `submitText`, `isSubmitting`); nothing else about them changed.
- The wrong-password error appears on the field on its own, because the keystore sets
  `errorMessage`, which that component already renders.
- Closing the modal without submitting resets the decoder and scanning starts over.
- Before the camera opens, the screen walks through the design's **two steps** (what to do on the
  other device, then what the scanning looks like), with the dots and the `Next` / `Sync from mobile`
  buttons. `SyncImportSteps` is shared, so mobile shows the same two steps in Steps 9 and 10, and
  both entry points (onboarding and a later sync) go through them.
- The route deliberately sits **outside** `AuthenticatedRoute` (but inside `KeystoreUnlockedRoute`),
  because Step 7 reuses this exact screen during onboarding, when there are no accounts yet. For the
  same reason it decides where to go afterwards from `hasPasswordSecret`: with a password (app in
  use) → personalize; without one (onboarding) → set the extension password first.
- Navigating from the popup works because the route is tab only, so `TabOnlyRoute` reopens it in a
  full tab.

Verified: `yarn extension:type:check-new` → 0 new errors, eslint clean on the new files.

**Gate.**

## Step 7 — Extension onboarding import

**Done.** `GetStartedScreen` → "Already an Ambire user" → the same `SyncFromMobileScreen` from Step 6
→ set extension password → personalize → dashboard. No second screen was written; the one screen
serves both entry points.

- `syncFromMobile` joined `ONBOARDING_WEB_ROUTES` and the onboarding route tree as a child of
  `getStarted` with the same `common` children every other import flow uses (`keyStoreSetup` →
  personalize → …), so the post-password part of onboarding is untouched.
- Being an onboarding route also means an abandoned sync tab is cleaned up by the existing
  `handleCleanUpOnPortDisconnect` (it resets the `newlyAdded` accounts), which is what we want.
- The back button now has three cases: from the scanner back to the instructions, in onboarding back
  through the onboarding history (get started), and otherwise back to the accounts screen.
- "Already an Ambire user" was **added** below the existing buttons; "Watch an address" is still
  there, unlike the design mockup which shows only two buttons above the new one. **Say if it should
  be removed** - it stays reachable from the "Add account" sheet either way.

Verified: `yarn extension:type:check-new` → 0 new errors, eslint clean on the changed files (the
errors in `onboardingNavigationContext` are pre-existing - same count before and after).

**Gate.**

## Step 8 — Mobile export ("Sync with extension" → Export to extension)

**Done.** The mobile counterpart of Step 5, as bottom sheets instead of a page:

- The accounts screen footer now has "Sync with extension" (secondary, with the design's sync glyph)
  under "Add account".
- It opens the **same shared `SyncBottomSheet`** as the extension - only the wording flips and the
  actions differ (mobile opens another sheet, the extension navigates to a page).
- `ExportToExtensionSheet` (mobile) holds the design's two numbered steps: the copyable
  `ambire.com/get-extension` link, the "do not share" warning, and the QR area, which starts as a
  placeholder, opens the select-accounts sheet (nested, like the existing saved-seed-phrases sheet)
  and then loops the animated QR codes with "N accounts selected. Edit your selection".
- Same `useAccountsSyncExport` hook and `SelectAccountsToSync` list as the extension, so the selection
  and payload logic exists once.
- The import option is a TODO placeholder until Step 9.

Verified: `yarn extension:type:check-new` → 0 new errors (it covers `src/mobile` too), eslint clean.
Not yet run on a device - that comes with Step 9/10, when the mobile side can be exercised end to end.

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
