import {
  applyCrashReportPolicy,
  isProviderErrorLike,
  isSuccessfulRpcStatusCode
} from '@common/config/analytics/crashReportPolicy'
import { scrubSentryEventSecrets } from '@common/config/analytics/sentryDataScrubbing'
import {
  CRASH_REPORT_ACCOUNT_TAGS,
  PRIVACY_POOLS_CONTROLLER_NAME
} from '@common/constants/crashAnalytics'

import type { ProviderError } from '@ambire-common/classes/ProviderError'
import type { Event as SentryEvent } from '@sentry/browser'

export const SCRUBBING_FAILED_MESSAGE = '[SCRUBBING_FAILED]'

/**
 * Replaces an event whose scrubbing threw with a marked placeholder that keeps only the
 * scrubber's own error. Throwing from `beforeSend` instead would make Sentry send the error
 * with the scope's data unscrubbed.
 *
 * Generic so it stays assignable to the `beforeSend` return type.
 */
export const buildScrubFailureFallbackEvent = <T extends SentryEvent>(
  event: T,
  scrubError: unknown
): T =>
  ({
    event_id: event.event_id,
    timestamp: event.timestamp,
    level: event.level,
    environment: event.environment,
    release: event.release,
    message: SCRUBBING_FAILED_MESSAGE,
    extra: {
      scrubErrorMessage: scrubError instanceof Error ? scrubError.message : String(scrubError),
      scrubErrorStack: scrubError instanceof Error ? scrubError.stack : undefined
    }
  }) as unknown as T

// Every engine mentions JSON when parsing fails, e.g. "is not valid JSON" in Chrome,
// "JSON.parse: unexpected character" in Firefox and "JSON Parse error" in Hermes
const JSON_MESSAGE_SUBSTRING = 'json'

/**
 * Whether the error comes from parsing a body that isn't JSON, such as the HTML error page a
 * service returns during an outage. Other syntax errors, like a BigInt built from a bad string,
 * give false.
 */
/**
 * Strips a Privacy Pools event down to the error's type and stack, in place. Privacy Pools errors,
 * their logs and the requests before them can hold the recipient, amounts or notes, and the user
 * id or account traits would link them to the install. Any error is treated so while a Privacy
 * Pools account is selected, as it can come from any controller. A deposit runs from a regular
 * account, so the controller's own errors are treated so too.
 */
export const stripPrivacyPoolsCrashReportEvent = (
  event: SentryEvent,
  isPrivacyPoolsAccountSelected: boolean
) => {
  const isPrivacyPoolsEvent =
    isPrivacyPoolsAccountSelected || event.extra?.controllerName === PRIVACY_POOLS_CONTROLLER_NAME
  if (!isPrivacyPoolsEvent) return

  delete event.breadcrumbs
  delete event.user
  Object.values(CRASH_REPORT_ACCOUNT_TAGS).forEach((tagKey) => {
    delete event.tags?.[tagKey]
  })
  delete event.contexts
  delete event.message
  delete event.extra
  event.exception?.values?.forEach((exception) => {
    delete exception.value
  })
}

export const isJsonSyntaxError = (error: unknown): boolean =>
  error instanceof Error &&
  error.name === 'SyntaxError' &&
  error.message.toLowerCase().includes(JSON_MESSAGE_SUBSTRING)

/**
 * Filters and scrubs a Sentry event for the extension UI, the extension background and the mobile
 * app. Gives back the event ready to send, or null when it must be dropped. Doesn't check the
 * user's opt-out.
 */
export const processCrashReportEvent = <T extends SentryEvent>(
  event: T,
  originalException: unknown
): T | null => {
  // Whether this shape of error is worth sending, how loud it is and which issue it
  // joins all live in one place.
  if (!applyCrashReportPolicy(event, originalException)) return null

  // Our services return HTML error pages during outages. The callers already retry, and
  // reporting every failed parse would only flood Sentry.
  if (isJsonSyntaxError(originalException)) return null

  // Matched by name rather than `instanceof`, so an error that reached us through the
  // messengers still counts. Those arrive as plain objects, not ProviderError instances.
  if (isProviderErrorLike(originalException)) {
    const { providerUrl, isProviderInvictus, statusCode } = originalException as ProviderError

    // Always delete breadcrumbs to reduce event size.
    delete event.breadcrumbs

    if (!isSuccessfulRpcStatusCode(statusCode)) {
      // We don't care about any data for non-2XX errors
      // We only want to know how many of them happened and group them accordingly

      delete event.user
      delete event.extra
      delete event.contexts
    }

    event.extra = {
      ...(event.extra || {}),
      providerUrl
    }

    event.tags = {
      ...(event.tags || {}),
      ...(isProviderInvictus
        ? {
            // Allows us to filter issues by provider in Sentry's UI
            providerUrl: providerUrl || 'should-never-be-undefined',
            providerType: 'invictus'
          }
        : { providerType: 'custom-rpc' })
    }
  }

  try {
    return scrubSentryEventSecrets(event)
  } catch (scrubError) {
    return buildScrubFailureFallbackEvent(event, scrubError)
  }
}
