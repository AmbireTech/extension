import { isHexString } from 'ethers'

type Eip712Types = Record<string, Array<{ name: string; type: string }>>

const toDecimalUint = (value: unknown): unknown => {
  if (typeof value === 'bigint') return value.toString()
  if (typeof value !== 'string') return value

  // Apps may send an uppercase "0X" prefix, which isHexString doesn't accept
  const hex = value.startsWith('0X') ? `0x${value.slice(2)}` : value

  // An empty "0x" is not a number, so it's left for the wallet to reject
  if (isHexString(hex) && hex.length > 2) return BigInt(hex).toString()

  return value
}

const toDecimalUintValue = (type: string, value: unknown, types: Eip712Types): unknown => {
  const arrayStart = type.lastIndexOf('[')

  if (arrayStart !== -1 && type.endsWith(']')) {
    const itemType = type.slice(0, arrayStart)

    return Array.isArray(value)
      ? value.map((item) => toDecimalUintValue(itemType, item, types))
      : value
  }

  if (types[type]) return toDecimalUintFields(type, value, types)
  if (type.startsWith('uint')) return toDecimalUint(value)

  return value
}

/**
 * Rewrites the `uint*` fields of an EIP-712 struct (including nested structs and arrays)
 * as decimal strings, leaving every other field untouched.
 *
 * Keystone 3 recomputes the hash of a Safe transaction (SafeTx) to show it, and reads its
 * number fields (`value`, `nonce`, gas fields) only as decimal strings, so a hex string
 * like `"0x07"` (which is how Ambire builds Safe transactions) makes it reject the whole
 * request with "Invalid QR Code". Converting every uint keeps other typed data consistent.
 * Both forms encode the same number, so the hash that gets signed does not change.
 */
const toDecimalUintFields = <T>(typeName: string, value: T, types: Eip712Types): T => {
  const fields = types[typeName]

  if (!fields || !value || typeof value !== 'object' || Array.isArray(value)) return value

  const normalizedValue: Record<string, unknown> = Object.fromEntries(Object.entries(value))

  fields.forEach(({ name, type }) => {
    if (!(name in normalizedValue)) return

    normalizedValue[name] = toDecimalUintValue(type, normalizedValue[name], types)
  })

  // Only the format of existing uint fields changes, so the value keeps its shape
  return normalizedValue as T
}

export { toDecimalUintFields }
