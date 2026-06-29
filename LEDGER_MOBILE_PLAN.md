# Ledger Hardware Wallet — Mobile Integration Plan

Status: **IN PROGRESS** (BLE path built, awaiting on-device verification) · Target branch: `v2`

### Progress log
- ✅ **Phase 0** — deps added (`@ledgerhq/react-native-hw-transport-ble@6.40.4`,
  `react-native-ble-plx@3.5.1` forced via `resolutions`, `@ledgerhq/hw-app-eth@7.8.7`),
  `yarn setup` + `pod install` clean, iOS `NSBluetoothAlwaysUsageDescription` added,
  Android perms covered by ble-plx's merged manifest. (0.3/0.4 runtime check = on-device, pending.)
- ✅ **Phase 1** — native `ledgerBleService` (BLE transport + hw-app-eth + serial queue +
  connection pub/sub) and `ledger.*` bridge cases in `WebViewWorker.tsx`.
- ✅ **Phase 2** — worker `LedgerController` / `LedgerSigner` / `LedgerKeyIterator`
  (bridge via `window.sendToRNAsync`), registered in `injectedLogic.ts`
  (`keystoreSigners.ledger` + `externalSignerControllers.ledger`).
- ✅ **Phase 3** — `useLedger.native.ts` (reactive), `LedgerConnectScreen` state machine
  (scan→select→connect→import), `MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_LEDGER` in mobile
  `handleActions`, Ledger entry in `ImportExistingAccountSelectorScreen`.
- Verified: `extension:type:check-new` = 0 new errors; lint clean on new files;
  `yarn build:webview` compiles; **ble-plx does NOT leak into the worker bundle** (grep = 0).
- ⏳ **Next**: build to a physical device, walk import + sign (Phase 4), then Android USB
  (Phase 5) and hardening (Phase 6).

Goal: bring Ledger support to the mobile app — connect during onboarding, import
accounts, sign messages (personal + EIP-712), and sign account ops — matching the
behaviour and code style of the existing extension/web implementation.

This doc is the single source of truth for the task. Check boxes as work lands.
Keep the "Open questions" section current.

---

## 0. TL;DR of the architecture decision

- The extension's `LedgerController` talks **WebHID** (`navigator.hid`). That API does
  **not exist** in React Native or in the mobile WebView worker. None of the web Ledger
  code is reusable on mobile beyond its shape and the shared `ambire-common` interfaces.
- A Ledger BLE/USB transport needs **native** Bluetooth/USB APIs. Those are **only**
  reachable from the React Native native JS context — **never** from the WebView worker,
  which is a sandboxed `file://` WebView built with `target: 'web'` (`.web.ts` resolved
  first), no `NativeModules`, and a locked-down CSP (`default-src 'none'`,
  `connect-src 'none'` in prod).
- Therefore: **the full Ledger device stack runs natively in RN; the worker-side
  `LedgerController` forwards each logical operation over the existing message bridge**
  (the same `sendToRNAsync` mechanism already used for `crypto.scrypt`, `crypto.pbkdf2`,
  `storage.*`, and `network.fetch`).
- **Bridge boundary = method-level** (decided). Native runs `@ledgerhq/hw-app-eth` +
  the BLE/USB transport. The worker controller bridges whole operations
  (`unlock` / `retrieveAddresses` / `signPersonalMessage` / `signTransaction` /
  `signTypedData`), one bridge round-trip per op. This keeps bridge traffic minimal
  (relevant given the known cold-start bridge-saturation perf issue).
- **iOS = BLE only.** After USB-C, iOS still does **not** allow third-party apps a wired
  USB connection to a Ledger; there is also no iOS RN USB transport. Confirmed against
  Ledger's own docs. (Sources in §3.)
- **Android = BLE + USB-OTG.** BLE via `@ledgerhq/react-native-hw-transport-ble`; USB via
  `@ledgerhq/react-native-hid` (Android-only native HID transport). BLE ships first; USB
  is a later phase.

---

## 1. Reference: how Ledger works in the extension (web)

Layers (all confirmed by reading the code):

- **`src/ambire-common`** (env-agnostic): `MainController`, `KeystoreController`,
  `SignMessageController`, `SignAccountOpController`, and the two seams we reuse on mobile:
  - `ExternalSignerController` interface — `src/ambire-common/src/interfaces/keystore.ts:31-62`
  - `KeystoreSignerInterface` interface — `keystore.ts:77-102`
- **`src/web/modules/hardware-wallet`** (web device code, all WebHID/DMK, not reusable):
  - `controllers/LedgerController/LedgerController.ts` — implements `ExternalSignerController`.
    Plain class, **not** an EventEmitter, holds **no** UI-store state and never calls
    `emitUpdate`. Uses the modern Ledger **DMK** stack
    (`@ledgerhq/device-management-kit` + `device-signer-kit-ethereum` +
    `device-transport-kit-web-hid`), **not** legacy `hw-app-eth`.
    Key methods: `unlock(path, expectedKeyOnThisPath?)`,
    `retrieveAddresses(paths[])` (await-in-loop, device can't do parallel `getAddress`),
    `signPersonalMessage(path, messageHex)`, `signTransaction(path, Uint8Array)`,
    `signTypedData({ path, signTypedData })`, `signingCleanup()`, `cleanUp()`.
    Plus statics `isSupported`, `isConnected`, `grantDevicePermissionIfNeeded`.
  - `libs/LedgerSigner/LedgerSigner.ts` — implements `KeystoreSignerInterface`. Created
    fresh per signing op by the keystore; the live controller is injected via
    `signer.init(externalSignerController)`. Normalises DMK `{r,s,v}` → flat hex sig.
    `sign7702` / `signTransactionTypeFour` **throw "not supported"** (keep this on mobile).
  - `libs/ledgerKeyIterator/ledgerKeyIterator.ts` — `KeyIteratorInterface`
    (`type='ledger'`, `subType='hw'`); `retrieve()` → `controller.retrieveAddresses(paths)`.
  - `screens/LedgerConnectScreen/` + `components/LedgerConnectModal/`.
- **`src/web/extension-services/background/background.ts`** (wiring):
  - `const ledgerCtrl = new LedgerController()` (single shared instance) — `:344`
  - `keystoreSigners: { internal, ledger: LedgerSigner, ... }` — `:506-513`
  - `externalSignerControllers: { ledger: ledgerCtrl, ... }` — `:514-519`

Flow seams (identical on mobile, reused unchanged):

- **Import**: `LedgerConnectScreen` → dispatch
  `MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_LEDGER` → `handleActions` →
  `MainController.handleAccountPickerInitLedger(LedgerKeyIterator)` (`main.ts:1182/1223`)
  which `cleanUp()`s any session, `unlock()`s path 0, builds a `LedgerKeyIterator`, and
  calls `accountPicker.setInitParams(...)`. The account-picker screen pages addresses via
  the iterator.
- **Sign**: the shared `src/common/hooks/useSign/useSign.ts` detects a Ledger key is
  involved and, if not connected, shows `LedgerConnectModal`. Actual signing happens in
  the worker: `SignMessageController.#sign` / `SignAccountOpController.#getSigner` →
  `keystore.getSigner` → `LedgerSigner` → `signer.init(externalSignerControllers.ledger)`
  → controller. Results flow back via the normal `emitUpdate` → store → re-render cycle.

---

## 2. Reference: mobile worker/bridge plumbing

- **Worker host (RN side):** `src/mobile/modules/webview/services/WebViewWorker.tsx` —
  a hidden 0×0 `<WebView>`. Exposes `dispatch(action)` and `init(config)`.
  `handleMessage` (~`:148-382`) is where **all native-proxied bridge calls are serviced**:
  `storage.get/set/remove`, `crypto.scrypt`, `crypto.pbkdf2`, `network.fetch`,
  `ui.window.action`, etc. **This is where the new `ledger.*` cases go.**
- **Worker entry (inside the WebView):**
  `src/mobile/modules/webview/services/injectedLogic.ts` — builds
  `new MainController({ ... externalSignerControllers: {} ... })` (`:228`, `:244`).
  `externalSignerControllers` is **currently empty** → mobile Ledger is unwired.
  `sendToRNAsync(type, payload)` (`:123-132`) is the worker→RN async-call primitive we
  reuse for `ledger.*`.
- **Dispatch path:** UI `useController.dispatch` → `WebViewWorker.dispatch` →
  `window.postMessage` → `injectedLogic` listener → `handleActions`
  (`src/mobile/handlers/handleActions.ts`, `case 'method'`) → `ctrl[method](...args)`.
- **State back:** `emitUpdate` → `onUpdate` → `debounceFrontEndEventUpdatesOnSameTick` →
  `sendToReactEvent('ctrl.update', ...)` → controllerStore → `useSyncExternalStore`.
- **Bundler:** `src/mobile/modules/webview/services/webpack.webview.config.js` —
  `target: 'web'`, `extensions` resolves **`.web.ts` first**, `react-native` →
  `react-native-web`, `react-native-mmkv: false`. Confirms the worker has zero native
  access; this is *why* Ledger must live natively.
- **Existing stubs to replace:**
  - `src/mobile/modules/hardware-wallet/screens/LedgerConnectScreen/LedgerConnectScreen.tsx`
    — placeholder text only.
  - `src/common/modules/hardware-wallets/hooks/useLedger/useLedger.native.ts` — all no-ops.
  - Route `ledgerConnect: 'ledger-connect'` already registered for mobile
    (`MainRoutes.tsx`, `common.ts:14`).

---

## 3. Platform/transport facts (with sources)

- iOS, post-USB-C: **no wired Ledger for third-party apps**; BLE only. No iOS RN USB
  transport exists. Sources:
  - https://support.ledger.com/article/360021488913-zd (connect device to phone)
  - https://support.ledger.com/article/115005463729-zd (OTG kit = Android only)
  - https://developers.ledger.com/docs/device-interaction/ledgerjs/integration/mobile-application/react-native-android-hid (HID = Android only)
- Android: BLE + USB-OTG both work.
- Packages (versions verified ~Jun 2026):
  - `@ledgerhq/react-native-hw-transport-ble` `6.40.4` (BLE; depends on `react-native-ble-plx`)
  - `react-native-ble-plx` `3.5.1` (the BLE transport pins `3.4.0` internally — force a
    single version via `resolutions`, as Rabby does)
  - `@ledgerhq/hw-app-eth` `7.8.7` (transport-agnostic ETH app bindings; runs natively)
  - `@ledgerhq/react-native-hid` `6.39.4` (Android-only USB/HID; later phase)
  - `@config-plugins/react-native-ble-plx` (Expo prebuild config plugin)
  - `react-native-permissions` (BLE permission prompts; Rabby uses `5.3.0`)
- Permissions:
  - iOS Info.plist: `NSBluetoothAlwaysUsageDescription`.
  - Android 12+: `BLUETOOTH_SCAN` (`neverForLocation`), `BLUETOOTH_CONNECT`. Pre-12:
    `BLUETOOTH`, `BLUETOOTH_ADMIN`, `ACCESS_FINE_LOCATION`.
- Cannot test on simulator/emulator — BLE + USB need a physical device.

### Reference implementation — Rabby mobile (open source, BLE-only)

`github.com/RabbyHub/rabby-mobile` (branch `develop`). Transport-agnostic `LedgerKeyring`
injected `getTransport: id => TransportBLE.open(id)`. Key files:

- Keyring (open/quit Eth app, APDUs): `packages/eth-keyring-ledger/src/LedgerKeyring.ts`
- Scan/pair hook: `apps/mobile/src/hooks/ledger/useLedgerImport.ts`
- High-level API + `checkEthApp`: `apps/mobile/src/core/apis/ledger.ts`
- Connect state machine: `apps/mobile/src/components/ConnectLedger/ConnectLedger.tsx`
- APDU-error → enum mapping: `apps/mobile/src/hooks/ledger/error.ts`
- BT permissions (forked from Rainbow): `apps/mobile/src/utils/bluetoothPermissions.ts`

Their connect flow (what is awaited): permission → `TransportBLE.observeState` (adapter)
→ `TransportBLE.listen` (scan, dedupe by `device.id`, 5s → "not found") → user selects →
`TransportBLE.open(id)` → `makeApp()` → `getAppAndVersion()`; if `BOLOS` → `openEthApp()`,
if wrong app → `quitApp()` + retry (60s timeout) → `getAddress`/`signTransaction`. All BLE
ops serialized through a concurrency-1 queue (BLE can't do parallel APDU exchanges).

---

## 4. Target architecture

```
RN NATIVE CONTEXT (has BLE/USB + NativeModules)        WEBVIEW WORKER (target:web, no native)
─────────────────────────────────────────────         ──────────────────────────────────────
LedgerConnectScreen (RN UI)                            MainController / SignMessageController /
  └─ useLedger.native.ts ─┐                            SignAccountOpController / AccountPicker
                          │                                          │
LedgerBleService (singleton)                           keystore.getSigner → LedgerSigner(mobile)
  • react-native-permissions                                         │ .init(externalSignerControllers.ledger)
  • TransportBLE.observeState / listen / open                       ▼
  • @ledgerhq/hw-app-eth (AppEth)                       LedgerController(mobile) : ExternalSignerController
  • concurrency-1 APDU queue                            • unlock/retrieveAddresses/sign* ──┐
  • openEthApp / quitApp / checkEthApp                                                     │
        ▲                                                                                  │
        │  WebViewWorker.tsx handleMessage                  sendToRNAsync('ledger.<op>', ) │
        └──────────  case 'ledger.*'  ◀──────────────────────────────────────────────────┘
                      (one round-trip per logical op)
```

- **Native `LedgerBleService`** (`src/mobile/services/ledger/`): owns the transport +
  `AppEth` instance + serial queue + connect/scan/permission logic. Singleton so the
  device session opened on the connect screen survives into later worker-driven sign ops.
- **`useLedger.native.ts`**: thin RN hook over `LedgerBleService` for the connect
  screen and the `useSign` connect modal. Returns the same shape as the web hook
  (`isLedgerConnected`, a connect/authorize fn) so `useSign` stays env-agnostic.
- **Worker `LedgerController` (mobile)**: implements `ExternalSignerController`; every
  method is a `sendToRNAsync('ledger.<op>', args)` call. Holds the same lightweight
  `unlockedPath` / `unlockedPathKeyAddr` bookkeeping the web one does (so `isUnlocked`
  works without a bridge hop). Registered in `injectedLogic.ts` `externalSignerControllers`.
- **Worker `LedgerSigner` (mobile)**: reuse the web `LedgerSigner` shape; if it is already
  device-agnostic (it only calls controller methods + ethers serialization), promote it to
  `src/common` or import as-is. Verify it has no WebHID/DMK imports before reusing.
- **`LedgerKeyIterator`**: device-agnostic (only calls `controller.retrieveAddresses`);
  reuse the web one (promote to `common` or re-import).
- **Bridge message types** (worker→RN): `ledger.unlock`, `ledger.retrieveAddresses`,
  `ledger.signPersonalMessage`, `ledger.signTransaction`, `ledger.signTypedData`,
  `ledger.signingCleanup`, `ledger.cleanUp`, `ledger.isConnected`. Serviced in
  `WebViewWorker.tsx` `handleMessage`, delegating to `LedgerBleService`.

Open design sub-question (resolve in Phase 1): does the **connect/scan UI** drive
`LedgerBleService` directly from RN (preferred — scanning is pure UI state, no worker
involvement), with the worker only ever calling the already-connected device? Assume
**yes** unless a blocker appears.

---

## 5. Task breakdown

Phased. Each task has a verify step. BLE-first; Android USB is a later phase.

### Phase 0 — Spike & de-risk (do before committing to the full build)
- [ ] **0.1** Add `@ledgerhq/react-native-hw-transport-ble`, `react-native-ble-plx`,
      `@ledgerhq/hw-app-eth`, `@config-plugins/react-native-ble-plx`,
      `react-native-permissions` via `yarn setup`. Pin one `react-native-ble-plx` via
      `resolutions`. → verify: `yarn setup` clean, no duplicate `ble-plx` in tree.
- [ ] **0.2** Expo config plugin + prebuild; add iOS `NSBluetoothAlwaysUsageDescription`
      and Android BLE permissions. → verify: `npx expo prebuild` succeeds; Info.plist +
      AndroidManifest contain the entries.
- [ ] **0.3** Throwaway RN spike screen: permission → scan → open → `AppEth.getAddress`
      on a **physical** device + real Ledger (BLE). → verify: real address prints for
      `m/44'/60'/0'/0/0`. **This is the go/no-go gate.**
- [ ] **0.4** Confirm `@ledgerhq/hw-app-eth` runs natively (Hermes) without polyfill gaps
      (Buffer, etc.). → verify: getAddress + a dummy `signPersonalMessage` round-trip.
- [ ] **0.5** LavaMoat: regenerate policy if extension build is affected
      (`yarn build:extensions:generate-policy`). → verify: only intended diffs. (Likely
      no-op since deps are mobile-only, but check.)

### Phase 1 — Native Ledger service + bridge (BLE)
- [ ] **1.1** `src/mobile/services/ledger/LedgerBleService.ts` (singleton): permissions,
      `observeState`, `listen` (dedupe, 5s timeout), `open`, concurrency-1 APDU queue,
      `AppEth` wrapper, `getAppAndVersion`/`openEthApp`/`quitApp`/`checkEthApp`,
      `disconnectDevice`, lifecycle cleanup. → verify: unit-callable from spike screen,
      all states reachable.
- [ ] **1.2** APDU-error → friendly-message mapping mirroring Rabby's `error.ts`
      (locked `0x6b0c`/`0x650f`/`0x5515`, no/wrong app `0x6511`, not installed
      `0x6984`/`0x6807`, user-reject `0x6985`/`0x5501`, fw update `0x6b00`/`0x6e00`,
      disconnect). Funnel through `ambire-common` `normalizeLedgerMessage` where possible
      for parity with web copy. → verify: each code maps to expected text.
- [ ] **1.3** Bridge: add `ledger.*` cases to `WebViewWorker.tsx` `handleMessage`,
      delegating to `LedgerBleService`, replying via the existing `response` protocol.
      → verify: a manual `sendToRNAsync('ledger.isConnected')` from worker returns
      correct bool.
- [ ] **1.4** Cleanup wiring: ensure transport closes on worker reload / app background /
      keystore lock; no dangling BLE subscriptions/listeners. → verify: connect →
      background → foreground leaves no leaked listener (per AGENTS.md cleanup rule).

### Phase 2 — Worker controller, signer, iterator (wire into ambire-common)
- [ ] **2.1** `LedgerController` (mobile) implementing `ExternalSignerController`, methods
      forward via `sendToRNAsync('ledger.<op>', ...)`; keep `unlockedPath`/
      `unlockedPathKeyAddr` + `isUnlocked` local. Place under
      `src/mobile/.../hardware-wallet/controllers/LedgerController/` (mirrors web path).
      → verify: `yarn extension:type:check-new` passes; implements interface fully.
- [ ] **2.2** `LedgerSigner` (mobile): reuse web one if device-agnostic; else port the
      non-WebHID parts. Keep `sign7702`/`signTransactionTypeFour` throwing. → verify:
      type-check; signature normalization identical to web.
- [ ] **2.3** `LedgerKeyIterator`: reuse web (promote to `common` or re-import). → verify:
      type-check.
- [ ] **2.4** Register in `injectedLogic.ts`: `keystoreSigners.ledger = LedgerSigner`,
      `externalSignerControllers.ledger = new LedgerController()`. → verify: worker boots,
      `MainController` sees a `ledger` external signer (no longer `{}`).

### Phase 3 — Connect screen + onboarding import
- [ ] **3.1** Implement `useLedger.native.ts` over `LedgerBleService` returning the web
      hook's shape (`isLedgerConnected`, authorize/connect fn). → verify: `useSign`
      compiles against it unchanged.
- [ ] **3.2** Real `LedgerConnectScreen` (mobile): state machine
      `permission → bluetooth-off → scan → select → not-found → open-eth-app → connected`
      with the edge states from §3. Use `BottomSheet`/modalize, `theme`, `spacings`,
      `flexbox`, `t()`, `useToast`, icons from `src/common/assets/svg` per AGENTS.md.
      Reference Rabby's `ConnectLedger` + `ConnectCommon`. → verify: each state renders;
      happy path reaches "connected" on device.
- [ ] **3.3** Onboarding import: on connect, dispatch
      `MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_LEDGER` (reuse web flow). Confirm mobile
      `handleActions` routes it to `MainController.handleAccountPickerInitLedger` and the
      account-picker screen pages addresses via the iterator. → verify: import ≥2 Ledger
      accounts on device; addresses match Ledger Live.
- [ ] **3.4** Place "Connect Ledger" entry point in the mobile add-account / onboarding UI.
      → verify: reachable from the add-account flow.

### Phase 4 — Signing
- [ ] **4.1** Sign **personal message** on a Ledger account end-to-end. → verify: signature
      validates (recovers to the Ledger address).
- [ ] **4.2** Sign **EIP-712 typed data**. → verify: validates; clear-sign or hash
      fallback both produce a valid sig.
- [ ] **4.3** Sign **account op** (the wallet's main tx flow), including the fee-payer =
      Ledger path. → verify: tx broadcasts / sig validates on a testnet.
- [ ] **4.4** `useSign` connect-modal path on mobile: when a Ledger key is involved and not
      connected, the connect modal appears and, once connected, signing resumes
      (auto-dismiss on `isLedgerConnected`). → verify: disconnect mid-flow → modal returns
      → reconnect → sign completes.
- [ ] **4.5** Mid-sign disconnect + cancel (`signingCleanup`) behave gracefully (no hang,
      clear error). → verify: pull device away mid-sign → friendly error, recoverable.

### Phase 5 — Android USB (OTG)
- [ ] **5.1** Add `@ledgerhq/react-native-hid` (Android-only). Guard all USB code behind
      `isAndroid`. → verify: iOS build unaffected.
- [ ] **5.2** `LedgerBleService` (or a sibling) gains a USB transport path; connect screen
      offers USB on Android. → verify: import + sign over USB-OTG on a physical Android.

### Phase 6 — Hardening & polish
- [ ] **6.1** All edge states from §3 surfaced with `useToast`/UI (BT off, denied,
      not-found, locked, app-not-open, not-installed, wrong-app, user-reject, fw-update,
      disconnect, stale bond → open BT settings).
- [ ] **6.2** Sentry `captureException` on unexpected errors (never swallow; never log
      secrets — APDUs/addresses are fine, no seeds/keys ever).
- [ ] **6.3** No leaked BLE listeners/subscriptions/timers (AGENTS.md). → verify: connect/
      disconnect cycles stable; memory steady.
- [ ] **6.4** `yarn extension:type:check-new` + `yarn lint:fix` clean.
- [ ] **6.5** Manual matrix: iOS BLE, Android BLE, Android USB × {import, personal sign,
      typed-data, account-op}. Record device models tested (Nano X / Flex / Stax).

---

## 6. Open questions / risks

- [ ] **Hermes compatibility** of `@ledgerhq/hw-app-eth` + `react-native-ble-plx` in this
      app's exact RN/Expo versions (Phase 0.3/0.4 confirms). Risk: Buffer/crypto polyfills.
- [ ] **`react-native-ble-plx` version skew** — transport pins `3.4.0`, latest `3.5.1`.
      Replicate Rabby's `resolutions` force. Confirm no double-instance.
- [ ] **Yarn patches** — Rabby patches all four Ledger packages. Investigate whether their
      patches fix real RN bugs we'll also hit; check Ledger issue tracker before assuming
      stock packages work.
- [ ] **Session persistence across screens** — confirm the native singleton transport
      opened on the connect screen is still valid when a later worker-driven sign op fires
      (re-open if BLE dropped; `unlock` must be resilient to a stale session, like the web
      `#initSDKSessionIfNeeded`).
- [ ] **`LedgerSigner`/`LedgerKeyIterator` reuse** — verify the web versions have zero
      WebHID/DMK imports before promoting to `common`; otherwise port the device-agnostic
      parts only.
- [ ] **Multiple devices found while scanning** — web has a `// TODO: Multiple devices?`;
      mobile UI must let the user pick (Rabby's select state).
- [ ] **DMK vs classic stack** — web uses Ledger **DMK**; mobile plan uses **classic
      `hw-app-eth`** (DMK RN transports exist but are less battle-tested and not what
      shipping wallets use). Accept the divergence; signature normalization differs
      (`hw-app-eth` returns `{r,s,v}` strings) — mirror web `LedgerSigner.#normalizeSignature`.
- [ ] **EIP-7702** stays unsupported for Ledger (match web — throw "not supported").

---

## 7. Done criteria

- iOS (BLE) and Android (BLE + USB) can: connect a Ledger in onboarding, import accounts,
  sign personal messages, sign EIP-712, and sign account ops — including fee-payer = Ledger.
- All edge/error states handled with clear UX.
- `yarn extension:type:check-new` + `yarn lint:fix` clean; no leaked native listeners.
- Code style matches the extension's Ledger implementation and project AGENTS.md rules.
