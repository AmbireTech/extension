import { captureException } from '@common/config/analytics/CrashAnalytics'

// Type-only, so it does not pull the turbo-module into the graph. The value side
// is loaded through the guarded require below.
type NativeCryptoModule = typeof import('react-native-ambire-crypto')

/**
 * The Rust turbo-module, or null when it is not installed on this platform or
 * runtime. Importing it runs `installRustCrate()` and `TurboModuleRegistry`
 * lookups that throw when the native side is missing, and this module sits on
 * the import path of every viem consumer, so a failure here must degrade to
 * plain viem instead of taking the whole bundle down.
 */
export const nativeCrypto: NativeCryptoModule | null = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('react-native-ambire-crypto')
  } catch (error) {
    captureException(error)
    // Logged as well as reported, because every shim degrades to plain JS from here
    // and the portfolio is what pays for it. Without this the app just gets slow,
    // with the only trace of why sitting in Sentry.
    console.error(
      '[Ambire] react-native-ambire-crypto failed to load; ABI encoding, ABI decoding and address checksumming all fall back to JS',
      error
    )

    return null
  }
})()
