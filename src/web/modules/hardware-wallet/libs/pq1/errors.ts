// User-facing errors for PQ1 accounts. `pq1-sdk` throws a `Pq1Error` with a
// stable `code` and a plain-language `userMessage`; this module turns it into
// the `ExternalSignerError` Ambire shows. A bundler rejection or an RPC
// failure during a send is left to Ambire's own broadcast error handling
// instead (see `PQ1Signer.broadcastAccountOp`).

import { isPq1Error, type Pq1ErrorCode } from 'pq1-sdk'

import ExternalSignerError from '@ambire-common/classes/ExternalSignerError'
import { captureException } from '@common/config/analytics/CrashAnalytics.web'

/** Ambire's own words where the SDK's would send the user somewhere else. */
const AMBIRE_MESSAGES: Partial<Record<Pq1ErrorCode, string>> = {
  unsupported:
    "This browser can't connect to a PQ1. Please use Chrome, Brave or Edge to add or use your PQ1 accounts.",
  disconnected:
    "The PQ1 isn't connected. Plug it in with the USB cable and try again. If it's already plugged in, open Add account, choose PQ1 (post-quantum) and press Connect PQ1 once, so this browser lets Ambire use it."
}

/** Codes for a bug or a firmware mismatch rather than something the user
 *  did: their text stays generic, and they are reported to Sentry. */
const UNEXPECTED_CODES: readonly Pq1ErrorCode[] = ['device-protocol', 'unknown']

/** Shown for anything unexpected. The original error goes to the logs and Sentry. */
export const PQ1_GENERIC_ERROR_MESSAGE =
  'Something went wrong while talking to the PQ1. Unplug it, plug it back in, and try again.'

/** Shown for anything unexpected while sending a transaction. Every step
 *  that can fail unexpectedly comes before the transaction is handed to the
 *  bundler, so nothing was sent. */
export const PQ1_SEND_FAILED_MESSAGE =
  'Something went wrong while sending this transaction with your PQ1. Nothing was sent. Please try again.'

/**
 * Turns any error from a PQ1 request into an `ExternalSignerError` whose
 * message is safe to show to the user. Expected outcomes (unplugged, locked,
 * rejected on the device, a request the device can't show, ...) keep the
 * SDK's plain explanation. Anything else gets `fallbackMessage`, and the
 * original error is logged and reported to Sentry so its technical detail
 * isn't lost.
 */
export function toUserFacingPq1Error(
  e: unknown,
  fallbackMessage: string = PQ1_GENERIC_ERROR_MESSAGE
): ExternalSignerError {
  if (e instanceof ExternalSignerError) return e
  if (isPq1Error(e) && !UNEXPECTED_CODES.includes(e.code)) {
    console.warn(`[pq1] ${e.code}: ${e.message}`)
    return new ExternalSignerError(AMBIRE_MESSAGES[e.code] ?? e.userMessage, {
      sendCrashReport: false
    })
  }
  console.error('[pq1] unexpected error', e)
  captureException(e)
  return new ExternalSignerError(fallbackMessage, { sendCrashReport: false })
}
