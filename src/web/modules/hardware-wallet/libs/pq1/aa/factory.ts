// The init code the device returns for a wallet's first deployment.

import { PQ_INIT_CODE_LEN } from '../config'
import { bytesToHex0x } from '../transport/bytes'

/** The init code's fields that are checked before a first deployment. */
export type InitCodeFields = {
  factory: `0x${string}`
  /** The bootstrap key, from which the factory derives the wallet address. */
  masterPkSeed: `0x${string}`
  masterPkRoot: `0x${string}`
}

/**
 * Split the 4280-byte factory initCode the firmware emits (GET_INIT_CODE /
 * SIGN_USEROP deploy path) into its fields. Layout:
 *   factory(20) ‖ selector(4) ‖ masterPkSeed(32) ‖ masterPkRoot(32)
 *   ‖ slot0PkSeed(32) ‖ slot0PkRoot(32) ‖ chainId(32) ‖ offset(32 = 0xC0)
 *   ‖ length(32 = 4008) ‖ factorySig(4008 padded to 4032)
 * Returns null when the length is not the expected one.
 */
export function parseInitCode(initCode: Uint8Array): InitCodeFields | null {
  if (initCode.length !== PQ_INIT_CODE_LEN) return null
  return {
    factory: bytesToHex0x(initCode.slice(0, 20)),
    masterPkSeed: bytesToHex0x(initCode.slice(24, 56)),
    masterPkRoot: bytesToHex0x(initCode.slice(56, 88))
  }
}
