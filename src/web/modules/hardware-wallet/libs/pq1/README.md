# PQ1 hardware wallet

PQ1 is a post-quantum hardware wallet. It signs with SPHINCS+ (a hash-based,
quantum-resistant signature scheme) instead of ECDSA and talks to the browser
over WebHID, with APDUs like a Ledger. Its accounts are **smart-contract
wallets** (`PQSmartWallet`, ERC-4337 with EntryPoint v0.6), not EOAs. An
account has the same CREATE2 address on every supported network
(`PQ1_SUPPORTED_CHAIN_IDS` in `src/common/modules/hardware-wallet/constants/pq1.ts`:
Ethereum, Base, Base Sepolia).

This directory holds everything PQ1-specific that isn't a screen, the
controller (`controllers/PQ1Controller`) or the keystore signer
(`libs/PQ1Signer`). It is web-only: the shared `ProviderController`, and so
the mobile bundle, only uses the chain list and the small dapp-provider
helpers in `src/common/modules/hardware-wallet/`. Browsers without WebHID
(Firefox, Safari) get a plain "your browser doesn't support WebHID" message.

The firmware is open source: [EthereumPhone/PQ1](https://github.com/EthereumPhone/PQ1/tree/0313a2ef).
File paths in comments that point "to the firmware repo" (`secure/src/...`,
`proto/src/lib.rs`, `docs/companion/...`) are relative to it. The wire
format, the size caps in `config.ts` and the catalogs below match that
commit.

## How it fits Ambire

Ambire's hardware-wallet support assumes an EOA signer: a key iterator that
derives addresses and a signer that returns ECDSA signatures. PQ1 differs in
four places, each handled where it happens:

| Concern | Where | What |
| --- | --- | --- |
| Importing accounts | `PQ1ConnectScreen`, `importAccounts.ts`, `IMPORT_PQ1_ACCOUNTS` | Granting the browser's permission to use the device needs a user gesture, which only a page has, so the connect screen (in both the first-run import list and "Add an account") connects the device itself, reads the addresses of its accounts 0-4, and dispatches them; the background writes `Account` + `ExternalKey` records with `creation: null`, so the rest of Ambire treats them as plain addresses. There is no key iterator: PQ1 has no BIP-32, just 256 numbered accounts. |
| Sending transactions | `aa/`, `KeystoreSignerInterface.broadcastAccountOp` (ambire-common) | The signer can't produce an EOA transaction. It packs the AccountOp's calls into one UserOperation, has the device sign it, and submits it to the bundler itself. `SignAccountOpController` calls this hook for `signingKeyType === 'pq1'` and tracks the result like any other bundler broadcast, using the fee the user approved. |
| Signing messages | `transport/offchain.ts`, `SignMessageContext` (ambire-common) | Signatures are verified on-chain via ERC-1271, or ERC-6492 for a wallet not deployed yet, so the signer needs the chain they will be verified on. ambire-common passes `{ chainId, provider }` through the signing helpers; EOA signers ignore it. |
| Dapp provider answers | `src/common/modules/hardware-wallet/libs/pq1DappProvider.ts` | `eth_getCode` and `wallet_getCapabilities` would describe the account as an EOA. `ProviderController` asks this module for PQ1 keys. |

## Layout

```
transport/   WebHID transport, the device's commands, request and reply formats
aa/          UserOps: the send pipeline (broadcast.ts) and each call's
             clear-signing bundles (callTrailers.ts)
db/          what the four clear-signing catalogs share (header, proofs, loader)
erc20/       token metadata ("Send 25 USDC")
names/       address names ("Uniswap V3 Router")
selectors/   function names, for calls the device has no other decoder for
erc7730/     ERC-7730 descriptors, for contract calls and EIP-712 typed data
safe/        Safe transactions: execTransaction, approveHash, MultiSendCallOnly
cowswap/     CoW Protocol orders: setPreSignature and order typed data
offchain/    Safe / CoW typed data shown natively by the device
config.ts    protocol constants and size caps; errors.ts, importAccounts.ts
```

## What the device shows

The device shows every request before it signs, in as much detail as Ambire
gives it the data for. The catalogs and API answers Ambire attaches are all
checked on the device (see below), so leaving one out never makes the device
show something false: it shows less, or refuses a call it knows needs the
data (a token transfer whose ERC-7730 descriptor is missing, for example).

- **Transactions**: one UserOp of up to 4 calls, with up to 8,192 bytes of
  data each and 16,384 together (a Safe `execTransaction` call: 4,096).
  Firmware that doesn't report `CAP_SIGN_USEROP_DATA_8K` takes 4,096 bytes
  per call; a longer call gets an "update your PQ1" message before anything
  is sent. Each call gets its bundles (`aa/callTrailers.ts`): a token's
  metadata, an ERC-7730 descriptor, the function name, and the names of the
  addresses shown. A CoW `setPreSignature` carries the order it pre-signs,
  read from the CoW API, and a Safe `approveHash` the Safe transaction it
  approves, read from the Safe Transaction Service. The device refuses those
  two without them, so Ambire refuses them first if it can't build them.
- **Messages**: `personal_sign` messages are shown as text, or as hex when
  they aren't text. A message too long for the device's pages is signed as
  its EIP-191 hash (`transport/personalSignView.ts`).
- **Typed data** takes the first route that fits: a Safe `SafeTx` or CoW
  `Order` is shown by the device's own screens, on firmware that reports
  the capability bit for it; then an ERC-7730 descriptor; otherwise the
  EIP-712 hash is signed blind, and the device shows a loud BLIND HASH
  warning. A request sent on one route is never retried on a weaker one.

## Device handling

- The background's controller keeps the device open while the service
  worker lives; a replug or a stale handle reconnects on the next request.
  Keeping it open also keeps the init-code cache: each GET_INIT_CODE spends
  a signature of the wallet's few-time bootstrap key.
- Requests over one connection go one at a time (`transport/hid.ts`). The
  connect screen has a connection of its own, so connecting a PQ1 there
  while it is signing something can make that signature fail.
- The background finds the PQ1 only among the devices the browser lets
  Ambire use. A PQ1 it doesn't (accounts synced from another browser, a
  removed permission) looks unplugged, so the "isn't connected" message
  points the user to the connect screen, which asks for that permission.
- The signer refuses to sign with a PQ1 other than the one the account was
  imported from (`deviceId`, the start of the device's account 0 address).

## Errors

Internal errors stay technical, for the logs. `errors.ts` is the one place
that turns PQ1 errors into plain messages for the user
(`toUserFacingPq1Error`): device states (unplugged, locked, rejected on the
device), and refusals raised as `Pq1UserError` with their technical detail
kept for the logs. Unexpected errors get a generic message and go to Sentry.
During a send, a bundler rejection or an RPC failure is left as it is, so
`SignAccountOpController` words it like any other broadcast failure. A send
the bundler doesn't answer is reported as unconfirmed, since it may still
have gone through.

## Clear-signing catalogs (`src/web/public/pq1/*.bin`)

The device holds only the Merkle root of each catalog. Ambire sends one entry
and its Merkle proof per lookup, and the device checks the proof against its
root:

- the extension has to ship the catalogs, because the device doesn't have
  them;
- a missing entry makes the device show less (a raw token amount, address or
  function selector) or refuse a call it knows needs it, and a forged one
  fails the proof;
- a catalog can't be trimmed or rebuilt on its own: its root is built into
  the firmware, and a catalog that doesn't match makes the device reject
  every proof built from it. `db/catalogRoots.test.ts` pins the four roots.

| File | Size | Contents |
| --- | ---: | --- |
| `erc20_db.bin` | 9.6 MB | ERC-20 name, symbol and decimals per (chain, contract) |
| `names_db.bin` | 112 KB | names of well-known contracts and addresses |
| `erc7730_db.bin` | 331 KB | ERC-7730 clear-signing descriptors (365) |
| `selectors_db.bin` | 775 KB | function signatures, shown when a call is blind-signed |

They are copied unchanged into the Chromium builds (`webpack/extension.js`;
Firefox and Safari have no WebHID), never imported into a JS bundle, and
fetched from the extension's own files the first time a PQ1 request needs
them, so users without a PQ1 account never load them. Because the device checks every entry, they could later be served
from a CDN instead with no loss of security.

**Refreshing the catalogs** goes with a firmware release that changes their
roots: copy the four `.bin` files from the firmware repo's
`tools/companion-stub/`, update the roots in `db/catalogRoots.test.ts`, and
rebuild `erc7730/catalog.review.json`, the per-descriptor summary that
`erc7730/ir.test.ts` checks the IR reader against, from the firmware's
`secure/data/erc7730.review.txt`.

## Testing

```
npx jest --config=./jest.config.js src/web/modules/hardware-wallet/libs/pq1 src/web/modules/hardware-wallet/libs/PQ1Signer src/common/modules/hardware-wallet/libs/pq1DappProvider
```

249 tests. They include:
- the send pipeline against a fake device, chain and bundler (`aa/broadcast.test.ts`);
- the WebHID transport against a fake device (`transport/hid.test.ts`);
- what dapps are told about a PQ1 account (`pq1DappProvider.test.ts`);
- payloads checked byte for byte against reference vectors from the firmware
  repo (`cowswap/e2eFirmwareVectors.test.ts`,
  `offchain/structuredTypedData.test.ts`, the catalog tests);
- the four catalogs checked against the firmware's roots.

No npm dependencies are added and the LavaMoat policy is unchanged.
