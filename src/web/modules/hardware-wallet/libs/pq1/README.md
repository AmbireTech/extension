# PQ1 hardware wallet

PQ1 is a post-quantum hardware wallet. It signs with SPHINCS+ (a hash-based,
quantum-resistant signature scheme) instead of ECDSA and talks to the browser
over WebHID, with APDUs like a Ledger. Its accounts are **smart-contract
wallets** (`PQSmartWallet`, ERC-4337 with EntryPoint v0.6), not EOAs. An
account has the same CREATE2 address on every supported network
(`PQ1_SUPPORTED_CHAIN_IDS` in `pq1-sdk`: Ethereum, Base, Base Sepolia).

## What lives where

The device protocol, clear signing and the ERC-4337 send pipeline are in the
[`pq1-sdk`](https://www.npmjs.com/package/pq1-sdk) package (MIT, source and
docs at [EthereumPhone/pq1-sdk](https://github.com/EthereumPhone/pq1-sdk)),
and the clear-signing catalogs in
[`pq1-sdk-catalogs`](https://www.npmjs.com/package/pq1-sdk-catalogs). Ambire
keeps only what adapts them to its controllers, keystore and UI:

| File | What |
| --- | --- |
| `controllers/PQ1Controller` | Owns the one connection to the device (the SDK's `Pq1DeviceManager`), and reads the accounts for the connect screen |
| `libs/PQ1Signer` | Ambire's `KeystoreSignerInterface` for PQ1 keys, on top of the SDK |
| `screens/PQ1ConnectScreen` | Grants the browser's permission to use the device, lists its accounts and imports the selected ones |
| `libs/pq1/context.ts` | What the SDK needs from Ambire: catalogs, Safe Transaction Service, bundler, chain reads, logging |
| `libs/pq1/errors.ts` | The SDK's errors as Ambire's `ExternalSignerError` |
| `libs/pq1/importAccounts.ts` | The `Account` and `ExternalKey` records of imported accounts |
| `src/common/modules/hardware-wallet/libs/pq1DappProvider.ts` | Adapts `ProviderController` to the SDK's `eth_getCode` and `wallet_getCapabilities` answers (`pq1-sdk/provider`) |

PQ1 is web-only and Chromium-only: Firefox and Safari have no WebHID, so the
connect screen tells the user to use Chrome, Brave or Edge. The shared
`ProviderController`, and so the mobile bundle, only uses `pq1-sdk/provider`,
which has no dependencies and doesn't touch the device.

## How it fits Ambire

Ambire's hardware-wallet support assumes an EOA signer: a key iterator that
derives addresses and a signer that returns ECDSA signatures. PQ1 differs in
four places, each handled where it happens:

| Concern | Where | What |
| --- | --- | --- |
| Importing accounts | `PQ1ConnectScreen`, `PQ1Controller`, `importAccounts.ts`, `IMPORT_PQ1_ACCOUNTS` | The connect screen (in both the first-run import list and "Add an account") asks for the browser's permission to use the device, which needs a user gesture. The background's controller then opens the device and reads the addresses of its accounts 0-4; the selected ones are written as `Account` + `ExternalKey` records with `creation: null`, so the rest of Ambire treats them as plain addresses. There is no key iterator: PQ1 has no BIP-32, just 256 numbered accounts. |
| Sending transactions | `KeystoreSignerInterface.broadcastAccountOp` (ambire-common) | The signer can't produce an EOA transaction. It packs the AccountOp's calls into one UserOperation with the SDK, has the device sign it, and submits it to the bundler itself. `SignAccountOpController` calls this hook for `signingKeyType === 'pq1'` and tracks the result like any other bundler broadcast, using the fee the user approved. |
| Signing messages | `SignMessageContext` (ambire-common) | Signatures are verified on-chain via ERC-1271, or ERC-6492 for a wallet not deployed yet, so the signer needs the chain they will be verified on. ambire-common passes `{ chainId, provider }` through the signing helpers; EOA signers ignore it. |
| Dapp provider answers | `pq1DappProvider.ts` | `eth_getCode` and `wallet_getCapabilities` would describe the account as an EOA. `ProviderController` asks the SDK's answers, through this module, for PQ1 keys. |

## Device handling

- Only the background opens the device, through the permission the connect
  screen granted, and keeps it open while the service worker lives; a replug
  or a stale handle reconnects on the next request. Requests over the
  connection go one at a time.
- The SDK caches each account's init code in `chrome.storage.local`: every
  GET_INIT_CODE spends a signature of the wallet's few-time bootstrap key.
- A PQ1 the browser doesn't let Ambire use (accounts synced from another
  browser, a removed permission) looks unplugged, so the "isn't connected"
  message points the user to the connect screen.
- The signer refuses to sign with a PQ1 other than the one the account was
  imported from (`deviceId`, the start of the device's account 0 address).

## Errors

The SDK throws `Pq1Error`s with a stable `code` and a plain `userMessage`.
`toUserFacingPq1Error` shows that message (in Ambire's words where the SDK's
would point elsewhere); anything unexpected gets a generic message and goes
to Sentry. During a send, a bundler rejection or an RPC failure is left as
it is, so `SignAccountOpController` words it like any other broadcast
failure. A send the bundler doesn't answer is reported as unconfirmed, since
it may still have gone through.

## Clear-signing catalogs

The device holds only the Merkle root of each catalog; the SDK sends one
entry and its proof per lookup, and the device checks the proof against the
root in its firmware. A missing entry makes the device show less (a raw
token amount, address or function selector), and a forged one fails the
proof. `pq1-sdk-catalogs` matches the firmware's roots, and its tests prove
every entry against them.

`webpack/extension.js` copies the four files (about 11 MB, 9.6 MB of it
ERC-20 metadata) unchanged from `node_modules/pq1-sdk-catalogs/data` into
the Chromium builds. They are fetched from the extension's own files the
first time a PQ1 request needs them, so users without a PQ1 account never
load them. Updating them is a version bump of `pq1-sdk-catalogs`, together
with a firmware release that changes the roots.

## LavaMoat

`pq1-sdk` runs in the background under LavaMoat with its own entry in
`lavamoat/webpack/policy.json`: WebHID (`navigator.hid`), `fetch` (bundler,
CoW and Safe APIs, the extension's catalogs) and `chrome.storage` / `runtime`
(the init-code cache, the catalogs' URL), plus `viem`.

## Testing

```
npx jest --config=./jest.config.js src/web/modules/hardware-wallet/libs/pq1 src/web/modules/hardware-wallet/libs/PQ1Signer src/common/modules/hardware-wallet/libs/pq1DappProvider
```

The SDK's own tests cover the device protocol (against a fake PQ1), clear
signing (byte for byte against the firmware's reference vectors) and the
send pipeline.
