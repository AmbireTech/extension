/**
 * The most bytes of encoded request (CBOR) Keystone 3 (firmware 3.1.4+) accepts. Above it,
 * it rejects the scanned QR code with "Invalid QR Code".
 * Source: keystone3-firmware `rust/rust_c/src/common/ur_budget.rs`.
 */
const MAX_QR_REQUEST_CBOR_BYTES = 14 * 1024
/**
 * The most bytes of typed data message Keystone 3 (firmware 3.1.0+) shows. It formats the
 * message as indented JSON and rejects the whole request with "Invalid QR Code" above it.
 * Source: keystone3-firmware `rust/apps/ethereum/src/eip712/eip712.rs`.
 */
const MAX_QR_TYPED_DATA_DISPLAY_BYTES = 4096
/**
 * The most values (the message itself, plus every nested value) Keystone 3 shows in a
 * typed data message, with the same "Invalid QR Code" outcome above it.
 */
const MAX_QR_TYPED_DATA_DISPLAY_VALUES = 64

const countDisplayValues = (value: unknown): number => {
  if (Array.isArray(value)) {
    return value.reduce((count: number, item) => count + countDisplayValues(item), 1)
  }
  if (value && typeof value === 'object') {
    return Object.values(value).reduce((count: number, item) => count + countDisplayValues(item), 1)
  }

  return 1
}

/**
 * Whether a typed data message is too large for a QR hardware wallet to show. Mirrors the
 * Keystone 3 limits, the strictest of the supported QR wallets. Pass the message exactly
 * as it's sent to the wallet.
 */
const exceedsQrTypedDataDisplayLimits = (message: unknown): boolean => {
  const display = JSON.stringify(message, null, 2)

  if (display === undefined) return false

  return (
    countDisplayValues(message) > MAX_QR_TYPED_DATA_DISPLAY_VALUES ||
    Buffer.byteLength(display, 'utf8') > MAX_QR_TYPED_DATA_DISPLAY_BYTES
  )
}

/**
 * Whether an encoded QR signing request is too large for a QR hardware wallet to accept.
 * Mirrors the Keystone 3 limit, the strictest of the supported QR wallets.
 */
const exceedsQrRequestSizeLimit = (cborBytes: number): boolean =>
  cborBytes > MAX_QR_REQUEST_CBOR_BYTES

export { exceedsQrRequestSizeLimit, exceedsQrTypedDataDisplayLimits }
