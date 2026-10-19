// A PQ1 wallet's deploy status and active owner, read from the chain for
// every send (`broadcast.ts`) and every signature (`PQ1Signer.ts`).
//
// The active slot/ownerIndex MUST be derived fresh from the chain on every
// operation: the values cached in the imported key's meta are the values at
// import time (always slot 0 / ownerIndex 1) and go stale the moment the
// user rotates the wallet's owner slot. A signature wrapped with a stale
// ownerIndex fails `PQSmartWallet.isValidSignature` for every verifier.

import type { JsonRpcProvider } from 'ethers'

import { encodeNextOwnerIndex } from './contracts'

/** A wallet's deploy status and active owner. */
export type Pq1AccountState = {
  isDeployed: boolean
  /** Active slot on the device (0 = bootstrap, ≥1 = rotated). */
  slotIndex: number
  /** Owner index the wallet verifies signatures against — `slotIndex + 1`. */
  ownerIndex: bigint
}

/** Parse an `eth_call` result that must be a non-empty return value. An
 *  empty `'0x'` means the callee has no code — on a PQ1-supported chain
 *  that indicates a wrong/unsupported deployment, so surface it clearly
 *  instead of letting `BigInt('0x')` throw a cryptic SyntaxError. */
export function parseCallBigInt(resultHex: string, what: string): bigint {
  if (!resultHex || resultHex === '0x') {
    throw new Error(`PQ1: ${what} returned no data — the contract is not deployed on this chain.`)
  }
  return BigInt(resultHex)
}

/**
 * Resolve deploy status + active slot/ownerIndex from the chain.
 *
 * Undeployed wallets can't be queried — the factory seeds slot 0 /
 * ownerIndex 1, so those are the correct values for the counterfactual
 * path. Deployed wallets report `nextOwnerIndex` (the next *unused*
 * ownerIndex); the active one is one less, with a minimum of 1 for the
 * bootstrap slot.
 */
export async function resolvePq1AccountState(
  provider: JsonRpcProvider,
  sender: `0x${string}`
): Promise<Pq1AccountState> {
  const code = await provider.getCode(sender)
  const isDeployed = code !== '0x' && code.length > 2
  if (!isDeployed) return { isDeployed, slotIndex: 0, ownerIndex: 1n }

  const r = await provider.call({ to: sender, data: encodeNextOwnerIndex() })
  const next = parseCallBigInt(r, 'nextOwnerIndex')
  const ownerIndex = next > 1n ? next - 1n : 1n
  return { isDeployed, slotIndex: Number(ownerIndex - 1n), ownerIndex }
}
