import { maxUint256 } from 'viem'

const isValidSafeNonce = (value: string, latestNonce?: bigint) => {
  if (!value || value.includes('.')) return false

  try {
    const nonce = BigInt(value)
    return nonce >= (latestNonce ?? 0n) && nonce <= maxUint256
  } catch {
    return false
  }
}

export { isValidSafeNonce }
