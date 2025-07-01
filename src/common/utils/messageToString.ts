import { getBytes, toUtf8String } from 'ethers'

const getMessageAsText = (msg: any) => {
  const bytes = getBytes(msg)
  const expectedPortionOfValidChars = 0.9
  const numberOfValidCharacters = bytes.filter((x) => x >= 0x20 && x <= 0x7e).length

  if (bytes.length * expectedPortionOfValidChars < numberOfValidCharacters) {
    try {
      return toUtf8String(msg)
    } catch (_) {
      return msg
    }
  }
  return `Hex message:\n${msg}`
}
interface TypedMessageVisualization {
  type: 'key' | 'value'
  value: any
  n: number
}
const simplifyTypedMessage = (value: any, n = 0): TypedMessageVisualization[] => {
  const res: TypedMessageVisualization[] = []
  if (Array.isArray(value)) {
    value.forEach((i) => {
      res.push(...simplifyTypedMessage(i, n + 1))
    })
    return res
  }
  if (value && typeof value === 'object') {
    Object.keys(value).forEach((k) => {
      res.push({ type: 'key', value: k, n })
      res.push(...simplifyTypedMessage(value[k], n + 1))
    })
    return res
  }
  return [{ type: 'value', value, n }]
}

export { getMessageAsText, simplifyTypedMessage }
