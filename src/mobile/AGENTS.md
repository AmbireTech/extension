This is the iOS and Android app. Read the root `AGENTS.md` first - this file only covers what is specific to mobile.

## There is no separate background

The controllers run in the same React Native JS realm as the UI, so there is no background context and no bridge between the two. `services/controllerHost/` is the `background`: it owns `MainController` and everything from `src/ambire-common`, and `handlers/handleActions.ts` is its action router (the counterpart of the extension's background `handleActions`).

A change anywhere reaches the app through the Metro bundle, so a plain reload is enough.

## The WebView worker

Mobile still builds a second bundle with webpack (`yarn dev:webview` / `yarn build:webview`, entry `modules/webview/services/injectedLogic.ts`) and `WebViewWorker.tsx` still mounts it. It hosts no controllers and reads no storage - what is left is the host a controller would need if one is ever moved back in: the RN bridge, a bridged fetch and storage, and the registry wiring that streams controller state to the UI.

`yarn dev:webview` is therefore not needed for the app to boot, but it still serves the inpage bundles `DappWebViewScreen` fetches in dev, so keep it running to browse dapps. For a native build the bundles are baked in by `yarn build:webview` - the production build commands already run it.

Everything the worker needs from the platform crosses the bridge to the RN side, where `WebViewWorker.tsx` handles it. The full set of messages is live regardless of whether anything is using them:

| Group                               | What it covers                                                             |
| ----------------------------------- | -------------------------------------------------------------------------- |
| `storage.get/set/remove`            | Persistence (async storage on the RN side)                                 |
| `crypto.scrypt`, `crypto.pbkdf2`    | Key derivation, handed to native implementations for speed                 |
| `network.fetch`                     | HTTP                                                                       |
| `ledger.*`, `trezor.*`, `nfc.*`     | Hardware wallets - the transports live in `services/`, never in the worker |
| `action.*`                          | Toasts, navigation, dapp events, WalletConnect responses                   |
| `system.*`, `ctrl.*`, `ui.window.*` | Worker lifecycle, state updates, errors                                    |

**Invariant:** never import a React Native or Expo module into worker-side code. It is not there, and the failure is silent. Add a bridge message instead - a `case` in `WebViewWorker.tsx` plus the caller on the worker side.

`shims/` swaps a few crypto packages (`eth-crypto`, `scrypt-js`, `pbkdf2`) for native-backed versions, wired through the aliases in `babel.config.js`. Those are for the RN bundle.

The init payload carries a one-shot snapshot of the storage keys listed in `constants/storageSnapshot.ts`, so a controller hosted in the worker can serve its boot reads from memory instead of one bridge round-trip per key. The list is empty while nothing is hosted there.

The wire format below applies to the worker's bridge only.

## The wire format

`bridgeCodec.ts` tags every message with one character:

- `'R'` - richJson, for anything carrying BigInt or Error: controller state, storage payloads.
- `'J'` - plain JSON, for dapp JSON-RPC traffic and `network.fetch`.

**Invariant:** controller state sent as `'J'` silently loses its BigInts. High-frequency dapp traffic sent as `'R'` is a real performance hit - richJson's per-node walk is the expensive part.

## Cold start is a first-class constraint

The controllers are constructed on the JS thread the UI renders on, so the boot path is tuned and easy to regress:

- Controllers are all initialized together; only `PhishingController` and `DappsController` are held back, because the lists they read are too large to sit on the boot path (with the goal of displaying the splash screen for less time). The dashboard fires `INIT_DEFERRED_CONTROLLERS` for them after its first render.
- What _is_ tiered is the streaming of state to the UI. Only the controllers in `constants/criticalControllers.ts` stream during boot - the rest are queued and drained once the splash hides and the UI flips the phase to `full`, so the heavy serialization never contends with the first paint. See `services/controllerHost/bootPhase.ts`.
- Past boot, that same file also suppresses state for any controller the UI has no subscriber for, and flushes it the moment one appears.
- Both bundles are minified with `keep_classnames` and `keep_fnames` (see `metro.config.js`). They must stay: controller identity comes from `this.constructor.name`, and mangling it breaks the app.
- `services/bootProfiler/` measures where the cold start goes, across the RN realm, the worker and the native launch. See its README.

## Where the non-obvious code lives

- `services/controllerHost/` - the `background`. `controllerHost.ts` (constructs the controllers), `bootPhase.ts`, `uiEvents.ts` (the controllers' only channel to the UI).
- `handlers/handleActions.ts` - the action router.
- `modules/webview/services/` - the worker and its bridge. `WebViewWorker.tsx` (RN side), `injectedLogic.ts` (worker entry), `bridgeCodec.ts`, `materializeWorkerBundle.ts`, `webpack.webview.config.js`.
- `contexts/controllersMiddlewareContext/` - where the UI's `dispatch` actually goes.
- `services/` - native-only: `ledger`, `trezor`, `nfc`, `bootProfiler`, `legacyMigration`, `nativeAbi`, `nativeCrypto`.
- `modules/inpage/` - the provider injected into dapp WebViews. A third bundle, built by the same webpack config.

## Gotchas

- The worker is a WebView, so React Native devtools do not show it. Its errors surface on the RN side as `ctrl.error` messages.
- `webview-bundle*.json` are gitignored build artifacts. Never edit them.
- Build and run commands, the webview dev server and OTA updates are documented in the root `README.MD`, under "Mobile Apps".
