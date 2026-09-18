import { classifyCrashReport } from '@common/config/analytics/crashReportPolicy'

import type { Event as SentryEvent } from '@sentry/browser'

/**
 * Applies the crash report policy to a Sentry event, in place. Returns false when a rule
 * drops that error shape and the event must not be sent.
 *
 * Both `beforeSend` hooks call this first, before scrubbing - there is no point scrubbing
 * an event that is about to be discarded. The UI and the background each pass their own
 * `beforeSend` to `Sentry.init`, so this is the only piece they share.
 */
export const applyCrashReportPolicy = (event: SentryEvent, originalException: unknown): boolean => {
  const decision = classifyCrashReport(originalException)

  if (!decision.shouldSend) return false

  event.level = decision.level
  event.fingerprint = decision.fingerprint

  return true
}
