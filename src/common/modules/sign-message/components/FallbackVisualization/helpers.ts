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
  integerFieldNames = new Set<string>(),
  maxLength = EIP712_VALUE_PREVIEW_MAX_LENGTH
): value is string =>
  !integerFieldNames.has(label) &&
  typeof value === 'string' &&
  isHexString(value) &&
  value.length > maxLength

export const getParsedMessageValue = (
  label: string,
  value: string | number,
  integerFieldNames = new Set<string>(),
  maxLength = EIP712_VALUE_PREVIEW_MAX_LENGTH
) => {
  if (integerFieldNames.has(label)) {
    try {
      return BigInt(value).toString()
    } catch {
      return value
    }
  }

  if (!isParsedMessageValueShortened(label, value, integerFieldNames, maxLength)) return value

  const prefixLength = Math.floor((maxLength - 3) / 2)
  const suffixLength = maxLength - 3 - prefixLength

  return `${value.slice(0, prefixLength)}...${value.slice(-suffixLength)}`
}
