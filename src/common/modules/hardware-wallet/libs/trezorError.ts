/** Error details consumed by the shared Trezor error humanizer. */
export type TrezorErrorPayload = {
  code?: string
  error?: string
  message?: string
}

/** Reads both v9 payload failures and v10 serialized errors without losing their details. */
export const getTrezorErrorPayload = (response: {
  payload?: unknown
  error?: { code?: string; message?: string }
}): TrezorErrorPayload => {
  if (response.error) {
    return { code: response.error.code, error: response.error.message }
  }

  return (response.payload || {}) as TrezorErrorPayload
}
