// User-facing errors for the PQ1 stack. Internal throws (wire-format
// invariants, protocol status words) stay technical so the logs are useful;
// this module is the single place that turns them into messages a
// non-technical user can act on. A bundler rejection or an RPC failure
// during a send is left to Ambire's own broadcast error handling instead
// (see `PQ1Signer.broadcastAccountOp`).

import ExternalSignerError from '@ambire-common/classes/ExternalSignerError'
import { captureException } from '@common/config/analytics/CrashAnalytics.web'

import { DeviceError, type DeviceErrorCode } from './transport/hid'

/** An error whose message is already written for the user. Thrown where the
 *  wallet refuses a request for a reason the user can understand (unsupported
 *  network, a transaction the device won't sign, ...). `technicalDetail`
 *  keeps the specifics for the logs. */
export class Pq1UserError extends Error {
  technicalDetail?: string

  constructor(message: string, technicalDetail?: string) {
    super(message)
    this.name = 'Pq1UserError'
    this.technicalDetail = technicalDetail
  }
}

const DEVICE_ERROR_MESSAGES: Record<DeviceErrorCode, string> = {
  disconnected:
    "The PQ1 isn't connected. Plug it in with the USB cable and try again. If it's already plugged in, open Add account, choose PQ1 (post-quantum) and press Connect PQ1 once, so this browser lets Ambire use it.",
  locked: 'The PQ1 is locked. Unlock it with your PIN and try again.',
  rejected: 'The request was rejected on the PQ1.',
  timeout: "The PQ1 didn't respond in time. Check the device screen, then try again.",
  refused:
    "The PQ1 refused this request. If it's showing its first-time setup, finish that first. Otherwise, check the device screen for the reason.",
  outdated: 'This needs a newer version of the PQ1 software. Update your PQ1 and try again.',
  'sign-refused':
    "The PQ1 refused to sign this because it couldn't show you every detail of it. Its screen says why. Nothing was signed or sent.",
  unsupported:
    "Your browser doesn't support WebHID, which is required for the PQ1. Please try using a different browser."
}

/** Shown when a PQ1 action is requested on a network without the PQ1
 *  contracts (see `PQ1_SUPPORTED_CHAIN_IDS`). */
export const PQ1_UNSUPPORTED_NETWORK_MESSAGE =
  "PQ1 accounts aren't available on this network. Switch to a network that supports PQ1 and try again."

// Requests with more data than any PQ1 firmware signs. The limit is the size
// of the device's buffers, not of its screen: a call to an unknown contract
// is signed blind, showing the data's length and hash, whatever its size.
// Data that only older firmware refuses (4,097 to 8,192 bytes in one call) is
// a `DeviceError` with code `outdated` instead.

const formatByteCount = (n: number): string => n.toLocaleString('en-US')

/** One call with more than `limit` (`MAX_TX_LEN`) bytes of data. */
export function callDataTooLargeMessage(bytes: number, limit: number): string {
  return `This transaction carries more data than a PQ1 can sign (${formatByteCount(bytes)} bytes in one action, and the most is ${formatByteCount(limit)}). If it's a swap, try a smaller amount or another route. Nothing was signed or sent.`
}

/** A batch whose calls carry more than `limit`
 *  (`MAX_BATCH_CALL_DATA_TOTAL_LEN`) bytes of data together. */
export function batchDataTooLargeMessage(bytes: number, limit: number): string {
  return `These actions carry ${formatByteCount(bytes)} bytes of data together, and a PQ1 can sign at most ${formatByteCount(limit)} in one transaction. Send them in smaller batches. Nothing was signed or sent.`
}

/** A Safe transaction whose data is over the device's Safe cap. */
export function safeTxTooLargeMessage(bytes: number, limit: number): string {
  return `This Safe transaction carries more data than a PQ1 can sign (${formatByteCount(bytes)} bytes, and the most is ${formatByteCount(limit)}). Nothing was signed or sent.`
}

/** Shown for anything unexpected. The original error goes to the logs and Sentry. */
export const PQ1_GENERIC_ERROR_MESSAGE =
  'Something went wrong while talking to the PQ1. Unplug it, plug it back in, and try again.'

/** Shown for anything unexpected while sending a transaction. Every step
 *  that can fail unexpectedly comes before the transaction is handed to the
 *  bundler, so nothing was sent. */
export const PQ1_SEND_FAILED_MESSAGE =
  'Something went wrong while sending this transaction with your PQ1. Nothing was sent. Please try again.'

/** True for the errors this module words for the user: a device error, a
 *  refusal raised by the PQ1 code, or an already user-facing signer error. */
export function isPq1Error(e: unknown): boolean {
  return e instanceof ExternalSignerError || e instanceof Pq1UserError || e instanceof DeviceError
}

/**
 * Turns any error from the PQ1 stack into an `ExternalSignerError` whose
 * message is safe to show to the user. Expected outcomes (unplugged, locked,
 * rejected on the device, ...) map to a plain explanation. Anything else gets
 * `fallbackMessage`, and the original error is logged and reported to Sentry
 * so its technical detail isn't lost.
 */
export function toUserFacingPq1Error(
  e: unknown,
  fallbackMessage: string = PQ1_GENERIC_ERROR_MESSAGE
): ExternalSignerError {
  if (e instanceof ExternalSignerError) return e
  if (e instanceof Pq1UserError) {
    if (e.technicalDetail) console.warn('[pq1]', e.technicalDetail)
    return new ExternalSignerError(e.message, { sendCrashReport: false })
  }
  if (e instanceof DeviceError && e.code) {
    console.warn('[pq1] device error', e)
    return new ExternalSignerError(DEVICE_ERROR_MESSAGES[e.code], { sendCrashReport: false })
  }
  console.error('[pq1] unexpected error', e)
  captureException(e)
  return new ExternalSignerError(fallbackMessage, { sendCrashReport: false })
}
