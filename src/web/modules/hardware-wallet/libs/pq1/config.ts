// Constants of the PQ1 USB protocol and of the PQ1 smart-wallet contracts.
// The wire values and size caps mirror the firmware (`proto/src/lib.rs` in
// the firmware repo, see the README); a payload over a cap is refused by the
// device, so the host checks the same caps first.

// ── Device transport ────────────────────────────────────────────────
/** USB vendor / product id of the PQ1. */
export const PQ1_VID = 0x1209
export const PQ1_PID = 0x7051
/** Every HID report is 64 bytes. */
export const REPORT_SIZE = 64
/** Report tag of an APDU frame. */
export const TAG_APDU = 0x05
/** HID channel id the device answers on. */
export const CHANNEL_ID = 0x0101

// ── APDU ────────────────────────────────────────────────────────────
/** Class byte of every PQ1 command. */
export const CLA_V2 = 0xf0

export const INS_GET_DEVICE_INFO = 0x01
export const INS_GET_STATUS = 0x02
export const INS_UNLOCK = 0x10
export const INS_SIGN_USEROP = 0x30
export const INS_SIGN_USEROP_BATCH = 0x32
export const INS_GET_WALLET_ADDRESS = 0x60
export const INS_GET_INIT_CODE = 0x61
export const INS_SIGN_OFFCHAIN = 0x62
export const INS_OFFCHAIN_SYNC = 0x64
export const INS_GET_RESPONSE = 0xc0

/** P1 of a chained command's chunks: more to come, or the last one. */
export const P1_MORE = 0x80
export const P1_LAST = 0x00

/** Status words. 0x6982 is a decision on the device (PIN wrong, request
 *  rejected), 0x6984 the 2-minute idle lock wiping the session mid-command,
 *  0x6985 a refusal that `DeviceCommands` tells apart with GET_STATUS. */
export const SW_OK = 0x9000
export const SW_SECURITY_CONDITION = 0x6982
export const SW_SESSION_EXPIRED = 0x6984
export const SW_CONDITIONS_NOT_SATISFIED = 0x6985
export const SW_INS_NOT_SUPPORTED = 0x6d00
/** `InternalError` in ISO 7816 terms. On a sign command it is almost always
 *  the device refusing to sign something it can't show in full; the device
 *  screen names the reason. */
export const SW_INTERNAL_ERROR = 0x6f00

/** OFFCHAIN_SYNC payload: account_index (1) ‖ chain_id (8 BE) ‖
 *  slot_index (4 BE) ‖ target_count (8 BE). */
export const OFFCHAIN_SYNC_INPUT_LEN = 1 + 8 + 4 + 8

// ── SIGN_USEROP ─────────────────────────────────────────────────────
/** The flags word of a SIGN_USEROP payload (u32 BE): bit 31 asks for the
 *  wallet's init code (first deployment), bit 30 registers a new owner slot
 *  (key rotation, which Ambire doesn't do), bits 29..22 hold the account
 *  number and bits 21..0 the owner slot. */
export const FLAG_INCLUDE_INIT_CODE = 0x80000000
export const ACCOUNT_INDEX_SHIFT = 22
/** The device holds 256 accounts, numbered from 0. */
export const MAX_ACCOUNT_INDEX = 0xff
/** Highest owner slot number (22 bits). */
export const MAX_SLOT_INDEX = 0x3fffff
/** True when `n` is one of the device's account numbers. */
export const isAccountIndex = (n: number): boolean =>
  Number.isInteger(n) && n >= 0 && n <= MAX_ACCOUNT_INDEX
/** True when `n` is an owner slot number the wire format can carry. */
export const isSlotIndex = (n: number): boolean =>
  Number.isInteger(n) && n >= 0 && n <= MAX_SLOT_INDEX
/** Calls one UserOp can carry. */
export const MAX_BATCH_TXS = 4
/** Longest calldata of one call. */
export const MAX_TX_LEN = 4096

// ── Signature and init-code sizes ───────────────────────────────────
/** A raw SPHINCS+ signature. */
export const C10_SIG_LEN = 4008
/** `abi.encode(uint256 ownerIndex, bytes signature)` around a raw signature. */
export const SIG_WRAPPER_LEN = 32 + 32 + 32 + Math.ceil(C10_SIG_LEN / 32) * 32 // 4128
/** The wallet factory call that deploys a PQ1 wallet (see `aa/factory.ts`). */
export const PQ_INIT_CODE_LEN = 20 + 4 + 5 * 32 + 32 + 32 + 4032 // 4280

// ── Clear-signing bundles ───────────────────────────────────────────
// Bundles Ambire attaches so the device can show a request in readable
// form. Each is checked by the device; these are the largest it accepts for
// the bundles Ambire builds.

/** An ERC-20 metadata bundle (`erc20/db.ts`). */
export const ERC20_BUNDLE_MAX_LEN = 1120
/** An address-name bundle (`names/db.ts`). */
export const NAME_BUNDLE_MAX_LEN = 1093
/** Name bundles one request may carry. */
export const MAX_NAME_BUNDLES = 4
/** A curated function-name bundle (`selectors/db.ts`). */
export const SELECTOR_BUNDLE_MAX_LEN = 1100
/** An ERC-7730 descriptor bundle (`erc7730/catalog.ts`): u16 IR length,
 *  the IR (≤ 4096), u32 leaf index, u32 proof depth, proof (≤ 32 levels).
 *  The device also takes an envelope of two descriptors, which Ambire
 *  doesn't build. */
export const ERC7730_BUNDLE_MAX_LEN = 2 + 4096 + 4 + 4 + 32 * 32 // 5130
/** The canonical Safe transaction fields (`safe/canonical.ts`). */
export const SAFE_TX_CANONICAL_LEN = 281
/** The Safe transaction bundle: canonical fields, u16 data length, data. */
export const SAFE_TX_BUNDLE_MAX_LEN = SAFE_TX_CANONICAL_LEN + 2 + MAX_TX_LEN // 4379
/** The canonical CoW order (`cowswap/canonical.ts`). */
export const COW_ORDER_CANONICAL_LEN = 204
/** The CoW order bundle: canonical order, then a u16-length-prefixed ERC-20
 *  bundle for each of the sell and buy tokens. The firmware calls this cap
 *  `COW_ORDER_TRAILER_MAX_LEN`; its `COW_ORDER_BUNDLE_MAX` is the cap of one
 *  of those ERC-20 bundles. */
export const COW_ORDER_BUNDLE_MAX_LEN = COW_ORDER_CANONICAL_LEN + 2 * (2 + ERC20_BUNDLE_MAX_LEN) // 2448

// ── SIGN_USEROP_BATCH trailers ──────────────────────────────────────
// After the calls, a batch payload ends in a list of tagged trailers:
// `[u8 count]` then `count × { u8 kind, u8 tx_idx, u16 BE len, bytes }`.

/** Version byte of the batch payload layout. */
export const SIGN_USEROP_BATCH_WIRE_VERSION = 2
/** Trailer kinds. The firmware also defines kind 2 (reserved) and kind 6 (a
 *  function name without a catalog proof), which Ambire never sends. */
export const TRAILER_KIND_ERC20 = 1
export const TRAILER_KIND_COW_ORDER = 3
export const TRAILER_KIND_SAFE_V1 = 4
export const TRAILER_KIND_SEL_CURATED = 5
export const TRAILER_KIND_ERC7730 = 7
export const TRAILER_KIND_NAME = 8
/** `tx_idx` of a trailer that applies to every call (the name bundles). */
export const TRAILER_TX_IDX_BATCH_WIDE = 0xff
/** Most trailers one batch may carry: 4 calls × 5 per-call kinds, plus 4
 *  name bundles, is 24; the firmware allows 32. */
export const MAX_TRAILERS_PER_BATCH = 32
/** Most trailer bytes one batch may carry. */
export const TRAILERS_TOTAL_MAX_LEN = 24 * 1024

// ── SIGN_OFFCHAIN ───────────────────────────────────────────────────
/** Header: account_index (1) ‖ chain_id (8 BE) ‖ slot_index (4 BE) ‖
 *  kind (1) ‖ payload_len (2 BE) ‖ flags (1). */
export const SIGN_OFFCHAIN_HEADER_LEN = 1 + 8 + 4 + 1 + 2 + 1 // 17
/** Payload kinds. The firmware also has kind 3, for typed data with nested
 *  structs, which Ambire doesn't send: such typed data is signed as its
 *  EIP-712 hash. */
export const OFFCHAIN_KIND_RAW32 = 0
export const OFFCHAIN_KIND_PERSONAL_SIGN = 1
/** EIP-712 typed data with an ERC-7730 descriptor. */
export const OFFCHAIN_KIND_EIP712_TYPED = 2
/** An EIP-712 Safe transaction (Safe ≥ v1.3.0). The device recomputes the
 *  `safeTxHash` from the fields it shows. */
export const OFFCHAIN_KIND_SAFE_TX = 4
/** An EIP-712 CoW Protocol order. The device recomputes the order digest
 *  from the order it shows. */
export const OFFCHAIN_KIND_COW_ORDER = 5
/** Flags bit: the wallet is deployed on the chain. Without it the device
 *  returns an ERC-6492 signature that deploys the wallet when verified. */
export const OFFCHAIN_FLAG_ACCOUNT_DEPLOYED = 0x01

/** Longest personal_sign message sent as the message itself; anything
 *  longer is signed as its EIP-191 hash (see `personalSignView.ts` for the
 *  other limits). */
export const MAX_OFFCHAIN_PERSONAL_SIGN_LEN = 700
/** Longest ABI-encoded struct body of a kind-2 (ERC-7730) request. */
export const MAX_OFFCHAIN_EIP712_ENCODED_DATA_LEN = 512
/** A kind-2 payload: domain-separator flag (2), domain separator (32),
 *  primary type hash (32), u16 length + struct body, u16 length + bundle. */
export const MAX_OFFCHAIN_EIP712_TYPED_LEN =
  2 + 32 + 32 + 2 + MAX_OFFCHAIN_EIP712_ENCODED_DATA_LEN + 2 + ERC7730_BUNDLE_MAX_LEN
/** A kind-4 payload: u16-length-prefixed Safe transaction, ERC-20 and CoW
 *  order bundles, then `[u8 n]` and n u16-length-prefixed name bundles. */
export const MAX_OFFCHAIN_SAFE_TX_LEN =
  2 +
  SAFE_TX_BUNDLE_MAX_LEN +
  2 +
  ERC20_BUNDLE_MAX_LEN +
  2 +
  COW_ORDER_BUNDLE_MAX_LEN +
  1 +
  MAX_NAME_BUNDLES * (2 + NAME_BUNDLE_MAX_LEN) // 12,334
/** A kind-5 payload is the CoW order bundle itself. */
export const MAX_OFFCHAIN_COW_ORDER_LEN = COW_ORDER_BUNDLE_MAX_LEN
/** The largest SIGN_OFFCHAIN input; the kind-4 payload dominates. */
export const SIGN_OFFCHAIN_INPUT_MAX_LEN =
  SIGN_OFFCHAIN_HEADER_LEN +
  Math.max(
    MAX_OFFCHAIN_PERSONAL_SIGN_LEN,
    MAX_OFFCHAIN_EIP712_TYPED_LEN,
    MAX_OFFCHAIN_SAFE_TX_LEN,
    MAX_OFFCHAIN_COW_ORDER_LEN
  )

/** The reply for a deployed wallet: off-chain count (8) and a raw signature. */
export const SIGN_OFFCHAIN_OUTPUT_LEN = 8 + C10_SIG_LEN // 4016
/** The ERC-6492 signature an undeployed wallet gets: `abi.encode(factory,
 *  factoryCalldata, signatureWrapper)` and the 32-byte 0x6492… suffix. */
export const ERC6492_WRAPPED_BLOB_LEN = 8608
/** The reply for an undeployed wallet: off-chain count (8) and the ERC-6492
 *  signature. */
export const SIGN_OFFCHAIN_OUTPUT_LEN_COUNTERFACTUAL = 8 + ERC6492_WRAPPED_BLOB_LEN // 8616

/** GET_DEVICE_INFO capability bits. Ambire sends off-chain kinds 4 and 5
 *  only to a device that reports their bit, never as a retry. */
export const CAP_OFFCHAIN_SAFE_TX = 1 << 3
export const CAP_OFFCHAIN_COW_ORDER = 1 << 4

/** How long to wait for the device's reply. Commands that can wait for the
 *  user (PIN, sign confirmations, a signature-count update) get longer. */
export function timeoutForIns(ins: number): number {
  switch (ins) {
    case INS_UNLOCK:
      return 60_000
    case INS_SIGN_USEROP:
    case INS_SIGN_USEROP_BATCH:
    case INS_SIGN_OFFCHAIN:
    case INS_OFFCHAIN_SYNC:
      return 120_000
    case INS_GET_WALLET_ADDRESS:
    case INS_GET_INIT_CODE:
      return 30_000
    default:
      return 5_000
  }
}

// ── Contracts ───────────────────────────────────────────────────────
/** ERC-4337 EntryPoint v0.6, which PQ1 wallets use (Ambire's own accounts
 *  use v0.7). */
export const ENTRY_POINT_V06 = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789' as const
/** PQSmartWalletFactory, deployed with CREATE2 (Arachnid's deterministic
 *  deployer), so it has this address on every chain in
 *  `PQ1_SUPPORTED_CHAIN_IDS`. The firmware derives wallet addresses from the
 *  same address (`PQ_SMART_WALLET_FACTORY`). */
export const FACTORY = '0xe8ce78cd976497447ff8b76c71b59ae42af0d452' as const

/** sha256 of an empty `paymasterAndData`. PQ1 UserOps have no paymaster,
 *  and SIGN_USEROP takes the hash of that field. */
export const SHA256_EMPTY = new Uint8Array([
  0xe3, 0xb0, 0xc4, 0x42, 0x98, 0xfc, 0x1c, 0x14, 0x9a, 0xfb, 0xf4, 0xc8, 0x99, 0x6f, 0xb9, 0x24,
  0x27, 0xae, 0x41, 0xe4, 0x64, 0x9b, 0x93, 0x4c, 0xa4, 0x95, 0x99, 0x1b, 0x78, 0x52, 0xb8, 0x55
])

// ── Gas ─────────────────────────────────────────────────────────────
/** Gas limits of the UserOp sent for estimation. The bundler's estimate
 *  replaces the call and pre-verification gas. */
export const ESTIMATE_PLACEHOLDER_GAS = {
  callGas: 50_000n,
  preVerificationGas: 250_000n,
  preVerificationGasFirstDeploy: 400_000n
} as const

/** The verification gas limit of every PQ1 UserOp. A SPHINCS+ signature
 *  check costs about 214k gas on a deployed wallet and about 760k on the
 *  first deployment (factory plus wallet check), mostly in SHA-256
 *  precompile calls whose cost a bundler's simulation can't always predict,
 *  so the limit is fixed rather than estimated. */
export const VERIFICATION_GAS_LIMIT = 800_000n

/** Runtime code that returns ABI `true` for any call: PUSH1 0x01, PUSH1 0x00,
 *  MSTORE, PUSH1 0x20, PUSH1 0x00, RETURN. Gas estimation runs with the
 *  SPHINCS+ verifier replaced by it (see `aa/broadcast.ts`). */
export const VERIFIER_STUB_RETURN_TRUE_CODE = '0x600160005260206000f3' as const

/** Pimlico's bundler endpoint for `chainId`. The key is the build-time
 *  `REACT_APP_PIMLICO_API_KEY` that ambire-common's own Pimlico bundler
 *  uses. */
export function pimlicoBundlerUrl(chainId: number | bigint, apiKey: string): string {
  return `https://api.pimlico.io/v2/${chainId.toString()}/rpc?apikey=${apiKey}`
}

export { PQ1_SUPPORTED_CHAIN_IDS } from '@common/modules/hardware-wallet/constants/pq1'
