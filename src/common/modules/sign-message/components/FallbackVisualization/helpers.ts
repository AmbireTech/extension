import { isHexString } from 'ethers'

export const EIP712_VALUE_PREVIEW_MAX_LENGTH = 42

export const getEip712IntegerFieldNames = (
  types: Record<string, { name: string; type: string }[]>,
  primaryType: string
) =>
  new Set(
    (types[primaryType] || [])
      .filter(({ type }) => type.startsWith('uint') || type.startsWith('int'))
      .map(({ name }) => name)
  )

export const isParsedMessageValueShortened = (
  label: string,
  value: string | number,
  integerFieldNames = new Set<string>()
): value is string =>
  !integerFieldNames.has(label) &&
  typeof value === 'string' &&
  isHexString(value) &&
  value.length > EIP712_VALUE_PREVIEW_MAX_LENGTH

export const getParsedMessageValue = (
  label: string,
  value: string | number,
  integerFieldNames = new Set<string>()
) => {
  if (integerFieldNames.has(label)) {
    try {
      return BigInt(value).toString()
    } catch {
      return value
    }
  }

  if (!isParsedMessageValueShortened(label, value, integerFieldNames)) return value

  const prefixLength = Math.floor((EIP712_VALUE_PREVIEW_MAX_LENGTH - 3) / 2)
  const suffixLength = EIP712_VALUE_PREVIEW_MAX_LENGTH - 3 - prefixLength

  return `${value.slice(0, prefixLength)}...${value.slice(-suffixLength)}`
}
