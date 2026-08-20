This is the iOS and Android app. Read the root `AGENTS.md` first - this file only covers what is specific to mobile.

## The split: RN side vs worker side

Mobile builds two separate JS bundles, with two different build systems:

| Bundle | Built by                                            | Entry                                       | Runs             |
| ------ | --------------------------------------------------- | ------------------------------------------- | ---------------- |
| RN/UI  | Metro (`yarn ios` / `yarn android` / `yarn start`)  | `index.js`                                  | Native app       |
| Worker | webpack (`yarn dev:webview` / `yarn build:webview`) | `modules/webview/services/injectedLogic.ts` | Inside a WebView |

The worker is the `background`: it owns `MainController` and everything from `src/ambire-common`. The RN side is the UI plus the native capabilities.

`yarn dev:webview` must be running the whole time you develop, whatever you touch - the app cannot boot without it, since no controller exists until the worker loads its bundle.

Which bundle you touched only decides how the change reaches the app:

- Controller, `ambire-common`, anything reached from `injectedLogic.ts` -> **worker bundle**. webpack rebuilds it and the WebView remounts itself, so the change lands on its own.
- Screen, component, hook, navigation -> **Metro bundle**. A plain reload is enough.

For a native build, the worker bundle is baked in by `yarn build:webview` - the production build commands already run it.

Some worker-side code lives outside `modules/webview/`, so the folder is not a reliable signal - `handlers/handleActions.ts` (the worker's action router, the counterpart of the extension's background `handleActions`) is the main one. Follow the imports from `injectedLogic.ts` when unsure.

## The worker has no native APIs

It is a WebView, so there is no React Native, no Expo, no native module inside it. Everything it needs crosses the bridge to the RN side, where `WebViewWorker.tsx` handles it:

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

## The wire format

`bridgeCodec.ts` tags every message with one character:

- `'R'` - richJson, for anything carrying BigInt or Error: controller state, storage payloads.
- `'J'` - plain JSON, for dapp JSON-RPC traffic and `network.fetch`.

**Invariant:** controller state sent as `'J'` silently loses its BigInts. High-frequency dapp traffic sent as `'R'` is a real performance hit - richJson's per-node walk is the expensive part.

## Cold start is a first-class constraint

The worker has to boot before any controller exists, so the boot path is tuned and easy to regress:

- The RN side ships a one-shot storage snapshot when it injects the worker, instead of the worker making N separate `storage.get` round-trips.
- Controllers are all initialized together; only `PhishingController` and `DappsController` are held back, because the lists they read are too large to sit on the boot path (with the goal of displaying the splash screen for less time). The dashboard fires `INIT_DEFERRED_CONTROLLERS` for them after its first render.
- What _is_ tiered is the streaming of state to the RN side. Only the controllers in `constants/criticalControllers.ts` stream during boot - the rest are queued and drained once the splash hides and the RN side flips the phase to `full`, so the heavy stringify+bridge+parse never contends with the first paint. See `modules/webview/services/bootPhase.ts`.
- Past boot, that same file also suppresses state for any controller the UI has no subscriber for, and flushes it the moment one appears.
- The worker bundle is minified with `keep_classnames`. It must stay: controller identity comes from `this.constructor.name`, and mangling it breaks the app.

Before adding work to the boot path, measure it. See `services/bootProfiler/README.md`.

## Where the non-obvious code lives

- `modules/webview/services/` - the bridge. `WebViewWorker.tsx` (RN side), `injectedLogic.ts` (worker entry), `bridgeCodec.ts`, `bootPhase.ts`, `materializeWorkerBundle.ts`, `webpack.webview.config.js`.
- `handlers/handleActions.ts` - worker side, despite the location.
- `contexts/controllersMiddlewareContext/` - where the UI's `dispatch` actually goes.
- `services/` - native-only: `ledger`, `trezor`, `nfc`, `bootProfiler`, `legacyMigration`.
- `modules/inpage/` - the provider injected into dapp WebViews. A third bundle, built by the same webpack config.

## Gotchas

- The worker is a WebView, so React Native devtools do not show it. Its errors surface on the RN side as `ctrl.error` messages.
- `webview-bundle*.json` are gitignored build artifacts. Never edit them.
- Build and run commands, the webview dev server and OTA updates are documented in the root `README.MD`, under "Mobile Apps".
