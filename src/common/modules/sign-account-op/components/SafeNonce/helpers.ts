const MAX_SAFE_NONCE = (1n << 256n) - 1n

const isValidSafeNonce = (value: string, latestNonce?: bigint) => {
  if (!value || value.includes('.')) return false

  try {
    const nonce = BigInt(value)
    return nonce >= (latestNonce ?? 0n) && nonce <= MAX_SAFE_NONCE
  } catch {
    return false
  }
}

export { isValidSafeNonce }
