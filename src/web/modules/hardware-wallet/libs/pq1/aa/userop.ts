// ERC-4337 v0.6 UserOperations for PQ1 wallets, in the JSON form bundlers
// take.

import { C10_SIG_LEN, SIG_WRAPPER_LEN } from '../config'
import { bytesToHex0x, u64be, u256be } from '../transport/bytes'

/** A UserOperation as `eth_sendUserOperation` takes it: every field hex. */
export type UserOpJson = {
  sender: `0x${string}`
  nonce: `0x${string}`
  initCode: `0x${string}`
  callData: `0x${string}`
  callGasLimit: `0x${string}`
  verificationGasLimit: `0x${string}`
  preVerificationGas: `0x${string}`
  maxFeePerGas: `0x${string}`
  maxPriorityFeePerGas: `0x${string}`
  paymasterAndData: `0x${string}`
  signature: `0x${string}`
}

/** The gas figures `eth_estimateUserOperationGas` returns. */
export type UserOpGasEstimate = {
  callGasLimit: `0x${string}`
  verificationGasLimit: `0x${string}`
  preVerificationGas: `0x${string}`
}

function toHex(n: bigint | number | string): `0x${string}` {
  const bi = typeof n === 'bigint' ? n : BigInt(n)
  return `0x${bi.toString(16)}`
}

export type BuildArgs = {
  sender: `0x${string}`
  nonce: bigint | number | string
  initCode: Uint8Array
  callData: `0x${string}`
  callGasLimit: bigint | number | string
  verificationGasLimit: bigint | number | string
  preVerificationGas: bigint | number | string
  maxFeePerGas: bigint | number | string
  maxPriorityFeePerGas: bigint | number | string
  paymasterAndData?: Uint8Array
  signature: Uint8Array
}

/** The JSON form of a UserOp, without a paymaster unless one is given. */
export function buildUserOp(args: BuildArgs): UserOpJson {
  return {
    sender: args.sender,
    nonce: toHex(args.nonce),
    initCode: bytesToHex0x(args.initCode),
    callData: args.callData,
    callGasLimit: toHex(args.callGasLimit),
    verificationGasLimit: toHex(args.verificationGasLimit),
    preVerificationGas: toHex(args.preVerificationGas),
    maxFeePerGas: toHex(args.maxFeePerGas),
    maxPriorityFeePerGas: toHex(args.maxPriorityFeePerGas),
    paymasterAndData: bytesToHex0x(args.paymasterAndData ?? new Uint8Array(0)),
    signature: bytesToHex0x(args.signature)
  }
}

/**
 * `op` with a placeholder signature for gas estimation, shaped like the real
 * one so the bundler measures what the real UserOp will cost (the
 * signature's length matters for the L1 data fee on L2s).
 *
 * The wallet decodes the signature as `abi.encode(uint256 ownerIndex, bytes
 * innerSig)` before checking it, and rejects a malformed wrapper before it
 * gets to the SPHINCS+ check — the bundler's simulation would then stop
 * early and never return an estimate. So the placeholder is a valid wrapper
 * (offset 0x40, length `C10_SIG_LEN`) around `0xff` bytes, and its
 * `ownerIndex` must be the callData's: the wallet checks that both name the
 * same owner. It still can't pass the SPHINCS+ check itself; see
 * `estimateUserOp` in `broadcast.ts` for how estimation gets past that.
 */
export function forEstimate(op: UserOpJson, ownerIndex: bigint | number): UserOpJson {
  const dummy = new Uint8Array(SIG_WRAPPER_LEN)
  // ownerIndex as a big-endian 32-byte word, the same as the callData's.
  dummy.set(u256be(BigInt(ownerIndex)), 0)
  // offset = 0x40 (bytes-head offset for the second arg in the ABI
  // envelope `(uint256, bytes)`).
  dummy[63] = 0x40
  // length = C10_SIG_LEN (4008), big-endian in the last 8 bytes of the
  // length word.
  dummy.set(u64be(C10_SIG_LEN), 96 - 8)
  // Inner SPHINCS+ sig payload — filled with 0xff so the verify call
  // path actually does the work (the dummy bytes won't verify, but the
  // gas cost up to that point is what we want measured).
  for (let i = 96; i < 96 + C10_SIG_LEN; i++) dummy[i] = 0xff
  // Trailing right-padding to the 32-byte boundary is already zero.
  return { ...op, signature: bytesToHex0x(dummy) }
}

/** `op` with the bundler's three gas figures. The pipeline then fixes the
 *  verification gas (`VERIFICATION_GAS_LIMIT`) and fits the fee to the
 *  device's screen. */
export function applyEstimate(op: UserOpJson, est: UserOpGasEstimate): UserOpJson {
  // Pimlico's figures are the ones to submit: they cover the L1 data fee on
  // L2s (in preVerificationGas) and the full validation and execution.
  return {
    ...op,
    callGasLimit: est.callGasLimit,
    verificationGasLimit: est.verificationGasLimit,
    preVerificationGas: est.preVerificationGas
  }
}

/** Swap in the real initCode + signature returned by SIGN_USEROP. */
export function finalize(
  op: UserOpJson,
  parts: { initCode?: Uint8Array | null; signature: Uint8Array }
): UserOpJson {
  return {
    ...op,
    initCode: parts.initCode && parts.initCode.length > 0 ? bytesToHex0x(parts.initCode) : '0x',
    signature: bytesToHex0x(parts.signature)
  }
}
