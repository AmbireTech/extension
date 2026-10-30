import { allowedMulticallContracts } from '@ambire-common/consts/safe'

/** Narrows request data (`unknown` once serialized for the UI) to a plain object */
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

/** Reads a number from request data, where it's a string once serialized for the UI */
export const toBigIntOrNull = (value: unknown): bigint | null => {
  if (typeof value === 'bigint') return value
  if (typeof value !== 'string' && typeof value !== 'number') return null
  if (value === '') return null

  try {
    return BigInt(value)
  } catch {
    return null
  }
}

/**
 * Whether the address is one of Safe's batch contracts, which a Safe
 * delegate calls to run several calls at once
 */
export const isSafeBatchContract = (address: unknown): boolean =>
  typeof address === 'string' &&
  allowedMulticallContracts.some((addr) => addr.toLowerCase() === address.toLowerCase())
