import { SignatureParts } from '@web/modules/hardware-wallet/qr/types'

export function isSignatureParts(value: unknown): value is SignatureParts {
  return typeof value === 'object' && value !== null && 'r' in value && 's' in value && 'v' in value
}
