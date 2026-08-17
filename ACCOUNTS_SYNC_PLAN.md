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

- `assets/images/scan-qr-codes.png` - the QR codes in the scanner frame, shown as the second import
  step by **both** products. Delivered at 472x472 and rendered at 236, so it stays sharp on dense
  screens (the SVG version was dropped: the QR inside it was an embedded bitmap anyway).

**Still needed:** the recording of the **steps on the mobile app**, for the extension's first import
step (TODO in `SyncFromMobileScreen`). An mp4 is enough - it gets converted to a GIF the same way as
the extension one.

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

**Done.** `SyncFromExtensionScreen` (`syncFromExtension` route, mobile): the shared two steps, then
the camera, then the "Verify extension password" sheet, then personalize. The mirror of Step 6, and
like it, this one screen also serves the onboarding entry point (Step 10).

- Step 1 shows the recording of the steps on the extension as a **GIF**
  (`assets/images/sync-steps-on-the-extension.gif`, 480px wide, 12fps, 446KB), rendered with a plain
  `Image`. The delivered Lottie was dropped: it was the screen recording rasterised into 62 base64
  **WebP** frames, which the Lottie renderers leave blank (every other animation in the app is pure
  vector, with no image assets). A GIF needs no new dependency - `Image` animates GIFs on iOS, Android
  has Fresco's `animated-gif` enabled in `build.gradle`, and it works on web too. Step 2's
  illustration is still missing (TODO in the file).
- Scanning reuses `QrScannerWithPermission`, which resolves to the native camera + UR decoder.
- The password sheet is `PasswordConfirmation` in a `BottomSheet` (the extension's
  `BottomSheetPasswordConfirmation` wrapper is web only), with the same note and the same
  wrong-password behaviour.
- Same three-case back button and the same `hasPasswordSecret` decision for where to go next as the
  extension, so onboarding lands on the device password first.
- The route sits inside `KeystoreUnlockedRoute` but outside `AuthenticatedRoute`, so Step 10 can reuse
  it before any accounts exist.

Verified: `yarn extension:type:check-new` → 0 new errors, eslint clean (the one warning in the mobile
`Router` is pre-existing). **The Lottie still needs an on-device check** - it carries 62 base64 WebP
frames, and `lottie-react-native` renders embedded images differently across platforms.

**Gate.**

## Step 10 — Mobile onboarding import

**Done.** The mirror of Step 7: the mobile `GetStartedScreen` got "Already an Ambire user", which opens
the same `SyncFromExtensionScreen` from Step 9. After the accounts arrive, the existing keystore setup
(device password + biometrics) runs, then personalize, then the dashboard.

- `syncFromExtension` joined `ONBOARDING_WEB_ROUTES` and the onboarding route tree next to the
  extension's `syncFromMobile`, both as children of `getStarted` with the usual `common` children.
  Only one of the two is reachable per product, so they don't interfere.
- Like on the extension, "Watch an address" was kept - **say if it should be dropped** from either get
  started screen.

Verified: `yarn extension:type:check-new` → 0 new errors, eslint clean on the changed files (the errors
in `onboardingNavigationContext` are pre-existing - identical count with and without the change).

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

## Step 12 — Reusing the other device's password during onboarding

**Done.** On a first onboarding the password step now offers to keep the password that was just
entered, so the freshly installed product doesn't ask for a second one right after.

- `SyncPasswordOptions` (shared) renders in the password sheet/modal, but only while the device has no
  `password` secret: **"Set up Ambire mobile / extension with the same password"**, on by default, and
  an **"Enable biometrics"** toggle nested under it, also on by default when biometrics are available.
  Availability differs per product: mobile needs a strong (Class 3) biometric enrolled, the extension
  needs WebAuthn support (`hasBiometricsHardware`), since there biometrics are a WebAuthn credential
  created on the spot rather than an already enrolled one.
- `useSyncedPasswordSetup` (shared) does what the skipped keystore setup screen would have: registers
  the password with `addSecret('password', …, leaveUnlocked: true)`, which also flushes the keys and
  seeds queued by the import, then registers the biometrics secret (saved from the prompt before the
  password, exactly as the keystore setup screen does) and records the terms acceptance. It reads the
  keystore's `hasPasswordSecret` + `isReadyToStoreKeys` instead of the transient `addSecret` SUCCESS
  status, which mobile can collapse, and re-enables the submit button if `addSecret` errors.
- With the toggle on, the sheet stays up with a submitting state until the password lands and then
  goes straight to personalize; with it off, the flow is unchanged (keystore setup screen next).
- A refused biometric prompt cannot abort anything (the accounts are already imported), so the
  password is still set and a toast says biometrics stayed off.
- `useAccountsSyncImport` now hands the entered password to `onImported`, which is what makes adopting
  it possible.
- `PasswordConfirmation` gained `withAutoFocus` (default unchanged) and the mobile sheet turns it off:
  the sheet opens after the component mounts, so the automatic focus landed off screen and left the
  keyboard down. The field is tapped instead. Its focus timer is now also cleared on unmount.

Verified: `yarn extension:type:check-new` → 0 new errors, eslint clean on the touched files.
**Still to check on a device/browser:** the two toggles in the onboarding case, both directions.

---

## Security notes to keep in review

- The QR blob is offline brute-forceable against a single password; `scrypt` N=131072 is the only
  cost barrier. Both designs already warn "Your QR code includes sensitive information".
- The exporter's real mainKey is briefly reconstructed in the importer's memory. It is used only to
  decrypt, never persisted, and dropped after the re-encrypt pass.
- Nothing in this flow writes to the exporting device; export is read-only.
