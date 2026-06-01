export const EIP712_DATA_PREVIEW_MAX_LENGTH = 42

export const getParsedMessageValue = (label: string, value: string | number) => {
  if (label !== 'data' || typeof value !== 'string' || value.length <= EIP712_DATA_PREVIEW_MAX_LENGTH)
    return value

  const prefixLength = Math.floor((EIP712_DATA_PREVIEW_MAX_LENGTH - 3) / 2)
  const suffixLength = EIP712_DATA_PREVIEW_MAX_LENGTH - 3 - prefixLength

  return `${value.slice(0, prefixLength)}...${value.slice(-suffixLength)}`
}
