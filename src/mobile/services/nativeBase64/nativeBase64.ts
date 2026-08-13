import { captureException } from '@common/config/analytics/CrashAnalytics'

// Type-only, so it does not pull the native module into the graph. The value side
// is loaded through the guarded require below.
type NativeBase64Module = typeof import('react-native-quick-base64')

/**
 * The JSI base64 codec, or null when it is not installed on this platform or
 * runtime.
 *
 * Importing the module runs `NativeModules.QuickBase64.install()`, which is what
 * puts the codec on the global object. The module swallows a missing native side
 * and leaves the global unset, so its functions would throw one call later
 * instead of at import. The globals are checked here so that reads as "no native
 * codec" up front, and callers can fall back to base64-js.
 *
 * This module sits on the import path of React Native's networking layer, so a
 * failure here must degrade rather than take the whole bundle down.
 */
export const nativeBase64: NativeBase64Module | null = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const quickBase64 = require('react-native-quick-base64') as NativeBase64Module
    const { base64FromArrayBuffer, base64ToArrayBuffer } = quickBase64.getNative()

    if (typeof base64FromArrayBuffer !== 'function') return null
    if (typeof base64ToArrayBuffer !== 'function') return null

    return quickBase64
  } catch (error) {
    captureException(error)

    return null
  }
})()
