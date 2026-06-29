# Ledger on mobile: why not DMK, and how the major wallets sign

Reference companion to `LEDGER_MOBILE_PLAN.md`. Explains why the mobile Ledger
integration uses the classic `@ledgerhq/hw-app-eth` stack instead of the Device
Management Kit (DMK) the browser extension uses, and how MetaMask / Rabby /
Rainbow implement Ledger signing on mobile.

## TL;DR

- The **extension** uses Ledger's **DMK** stack (`@ledgerhq/device-management-kit`
  + `device-signer-kit-ethereum` + `context-module`) over a **WebHID** transport.
- **No major mobile wallet uses DMK.** MetaMask Mobile, Rabby Mobile, and Rainbow
  all use the **classic** stack: `@ledgerhq/hw-app-eth` +
  `@ledgerhq/react-native-hw-transport-ble` + `react-native-ble-plx`.
- Ambire mobile follows the same classic path — the right call for React Native.
- A DMK React-Native BLE transport now exists
  (`@ledgerhq/device-transport-kit-react-native-ble`), so DMK-on-mobile is not
  impossible — but it's unproven on Hermes and nobody ships it (see risks below).

## Why DMK doesn't fit React Native / Hermes

1. **DI runtime built on `inversify` + `reflect-metadata` (+ `xstate`).** DMK's
   core resolves its services through an inversify dependency-injection
   container, which depends on the Metadata Reflection API and decorator
   metadata. On Hermes this is fragile: it needs `import 'reflect-metadata'` as
   the very first import, is import-order sensitive, and hits the known
   "reflect-metadata loaded twice" class of inversify problems. The classic
   `hw-app-eth` path has none of this.
2. **Web-first, RN support arrived late and undocumented.** Ledger's official
   "How to use DMK" integration page documents only WebHID / WebBLE transports —
   no React Native guidance. The RN transports exist in the device-sdk-ts
   monorepo but are recent additions, whereas `react-native-hw-transport-ble` is
   the long-standing, battle-tested mobile transport every wallet already ships.
3. **Heavier dependency surface** (inversify, reflect-metadata, xstate, ws,
   isomorphic-ws) to bundle and keep working under Hermes + the new architecture,
   for no user-visible benefit beyond ERC-7730 generic clear-signing.

**Concrete evidence of RN/Hermes friction even with the *lighter* classic lib:**
MetaMask Mobile ships a patch to `@ledgerhq/hw-app-eth` wrapping every
`Buffer.subarray(...).toString(...)` in `Buffer.from(...)`, because Hermes'
`Buffer` polyfill returns a plain typed-array view from `.subarray()` that loses
`Buffer` methods. If the classic lib needs Hermes patching, the much heavier DMK
DI stack carries materially more RN risk. → **See the actionable note at the
bottom — Ambire mobile uses the same `hw-app-eth` and may need the same patch.**

## How the major mobile wallets implement Ledger signing

All three use `hw-app-eth` over `react-native-hw-transport-ble` (BLE). Differences
are in connection lifecycle and whether they clear-sign.

| | Stack | BLE connection model | Clear-signing (tx) |
|---|---|---|---|
| **MetaMask Mobile** | classic `hw-app-eth` + `react-native-hw-transport-ble`, via shared `@metamask/eth-ledger-bridge-keyring` | Transport held for a flow; force-closed with `TransportBLE.disconnectDevice` (immediate, vs the SDK's lazy 5s teardown); retries transient BLE errors (max 3) | **Off** — `ledgerService.resolveTransaction(tx, {}, {})` with empty config (blind / limited) |
| **Rabby Mobile** | classic `hw-app-eth` + `react-native-hw-transport-ble` | **Per-operation open → one op → close** (`finally { transport.close() }`); `_reconnect()` retry loop in keyring; `TransportBLE.disconnectDevice` on error | Resolution via the keyring, but no persistent connection to tear down |
| **Rainbow Mobile** | classic `hw-app-eth` + `react-native-hw-transport-ble` (identical versions to MetaMask) | classic | classic |
| **Ambire extension** | **DMK** + `device-signer-kit-ethereum` + `context-module` over **WebHID** | DMK session per (re)connect | Full DMK `ContextModule` clear-signing incl. ERC-7730 |

Common to all mobile implementations:
- Scanning via `TransportBLE.listen`; BLE adapter state via `TransportBLE.observeState`.
- Android 12+ runtime permissions `BLUETOOTH_SCAN` + `BLUETOOTH_CONNECT`; older
  Android uses `ACCESS_FINE_LOCATION`. iOS prompts via `NSBluetoothAlwaysUsageDescription`.
- `getAddress(path, false)` to verify the device is unlocked + on the Ethereum app.

## What Ambire mobile does (and how it compares)

- **Same classic stack** as MetaMask / Rabby / Rainbow (`hw-app-eth` +
  `react-native-hw-transport-ble` + `react-native-ble-plx`).
- **Architecture difference (ours, by necessity):** Ambire's controllers run in a
  WebView worker with no native access, so the device stack lives in a native RN
  singleton (`src/mobile/services/ledger/ledgerBleService.ts`) and the worker-side
  `LedgerController` forwards each op over the message bridge. Neither MetaMask nor
  Rabby has this split (their keyrings run in the RN JS context directly).
- **Connection model:** persistent connection (established on the connect screen,
  reused by later worker-driven signing), with auto-reconnect via
  `ensureConnected`/`lastDeviceId`, plus teardown on keystore-lock / app-background
  (Rabby avoids needing this via per-op open/close; we chose persistence for
  better in-flow UX given the screen↔worker split).
- **Clear-signing:** `ledgerService.resolveTransaction(tx, {}, { erc20, nft,
  externalPlugins, uniswapV3 })` with a 5s timeout→blind fallback. This is
  **more** than MetaMask Mobile (which passes empty `{}` = blind). EIP-712 uses
  `signEIP712Message` with a hashed-message fallback.
- **The only thing the extension has that we don't:** DMK `ContextModule`
  **ERC-7730 generic clear-signing** for arbitrary contracts. Closing that gap =
  porting the native stack to DMK (~3–4 days *if* a Hermes spike passes; the
  inversify/reflect-metadata DI is the gating risk). Not recommended unless
  ERC-7730 is a hard requirement.

## Hermes `Buffer.subarray` patch — APPLIED

MetaMask patches `@ledgerhq/hw-app-eth` for Hermes because `Buffer.subarray()`
returns a plain typed-array view that loses `Buffer` methods, so
`.toString('hex')` on it misbehaves — producing malformed `r`/`s` signatures and
broken app name/version parsing.

We applied the same fix pre-emptively (mirroring MetaMask):
`patches/@ledgerhq+hw-app-eth+7.8.7.patch` wraps the affected `.subarray(...)`
calls in `Buffer.from(...)` in `Eth.js` (signTransaction / signPersonalMessage
`r`/`s`), `modules/EIP712/index.js` (EIP-712 `r`/`s`), and `modules/EIP712/utils.js`
(app name/version, `getAppAndVersion`). It is auto-applied by `yarn setup`
(patch-package). No on-device repro needed — the bug can't bite.

## Clear-sign provisioning fallback (Rabby-derived) — APPLIED

The **same** `hw-app-eth` patch also wraps the clear-sign descriptor-provisioning
loops in `signTransaction` (`setPlugin` / `setExternalPlugin` /
`provideNFTInformation` / `provideERC20TokenInformation`, Eth.js ~186–197) in
try/catch → log + continue. Upstream 7.8.7 leaves these unguarded (only the
`domains` loop is non-blocking), so a single failed descriptor APDU would abort
the whole signature.

This matters **because we enable clear-signing** (`erc20`/`nft`/`externalPlugins`/
`uniswapV3`). MetaMask doesn't need it — they sign blind (`resolveTransaction(tx,
{}, {})`), so the provide loops never run. Rabby ships the equivalent patch
(`.yarn/patches/@ledgerhq-hw-app-eth-...-rabby.patch`) for the same reason. With
it, a flaky clear-sign descriptor degrades to blind signing instead of failing
the sign.

## Sources

- MetaMask Mobile `package.json`, `LedgerBluetoothAdapter.ts`, `Ledger.ts`;
  `@metamask/eth-ledger-bridge-keyring` `ledger-mobile-bridge.ts`
  (`resolveTransaction(tx, {}, {})`) + the `hw-app-eth` Hermes patch.
- Rabby Mobile `LedgerKeyring.ts`, `core/apis/ledger.ts` (per-op open/close).
- Rainbow `package.json` (classic stack, no DMK).
- Ledger "How to use DMK" docs (WebHID/WebBLE only); inversify reflect-metadata
  issues (InversifyJS#737, #1189).
