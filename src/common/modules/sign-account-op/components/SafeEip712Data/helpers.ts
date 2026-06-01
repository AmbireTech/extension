import type { TypedMessageUserRequest } from '@ambire-common/interfaces/userRequest'

type SafeEip712DataValue = TypedMessageUserRequest['meta']['params'] & {
  safeTxHash: string
  domainHash: string
  messageHash: string
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

export const getSafeEip712DataValue = (value: unknown): SafeEip712DataValue | null => {
  if (!isObject(value)) return null
  if (!isObject(value.domain) || !isObject(value.types) || !isObject(value.message)) return null
  if (typeof value.primaryType !== 'string') return null
  if (typeof value.safeTxHash !== 'string') return null
  if (typeof value.domainHash !== 'string') return null
  if (typeof value.messageHash !== 'string') return null

  return value as SafeEip712DataValue
}
