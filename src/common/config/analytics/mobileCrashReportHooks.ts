import { processCrashReportEvent } from '@common/config/analytics/processCrashReportEvent'
import { scrubSentryEventSecrets } from '@common/config/analytics/sentryDataScrubbing'
import {
  CONSOLE_BREADCRUMB_CATEGORY,
  CONSOLE_BREADCRUMB_LEVELS,
  CONSOLE_BREADCRUMB_MESSAGE_MAX_LENGTH,
  CONSOLE_BREADCRUMB_SCRUB_MARGIN,
  CRASH_ANALYTICS_UNAVAILABLE_REASON,
  CRASH_REPORT_CONTENT,
  CrashAnalyticsUnavailableReason,
  CrashReportContent,
  TOUCH_BREADCRUMB_CATEGORY
} from '@common/constants/crashAnalytics'

import type { Breadcrumb, Event as SentryEvent, SeverityLevel } from '@sentry/browser'

/** The extra data a mobile capture can carry, merged into Sentry's capture context. */
export type CrashReportCaptureContext = {
  tags?: Record<string, string | number | boolean>
  extra?: Record<string, unknown>
  level?: SeverityLevel
  fingerprint?: string[]
}

/**
 * Why the mobile crash reporter can't start in a build, whatever the user's choice. Gives null
 * when the build can run it.
 */
export const getCrashAnalyticsUnavailableReason = ({
  dsn,
  isDevBuild
}: {
  dsn: string | undefined
  isDevBuild: boolean
}): CrashAnalyticsUnavailableReason | null => {
  if (isDevBuild) return CRASH_ANALYTICS_UNAVAILABLE_REASON.DEV_BUILD
  if (!dsn) return CRASH_ANALYTICS_UNAVAILABLE_REASON.MISSING_DSN

  return null
}

/**
 * The Sentry release of a mobile build. Must stay in sync with the release name the source maps
 * and debug symbols are uploaded under.
 */
export const getMobileCrashReportRelease = (platformOS: string, appVersion: string) =>
  `mobile-${platformOS}@${appVersion}`

// The raw logged objects can be large and hold anything, while the message already has their
// text. Dropping them before the scrub also spares it a deep walk on every console call.
// The message is cut short for the same reason, but past the final cut by a margin, so a secret
// split at the final cut is still recognized in full.
const prepareConsoleBreadcrumbForScrub = (breadcrumb: Breadcrumb): Breadcrumb => {
  const message = breadcrumb.message?.slice(
    0,
    CONSOLE_BREADCRUMB_MESSAGE_MAX_LENGTH + CONSOLE_BREADCRUMB_SCRUB_MARGIN
  )
  if (!breadcrumb.data) return { ...breadcrumb, message }

  const data = { ...breadcrumb.data }
  delete data.arguments
  return { ...breadcrumb, message, data }
}

/**
 * The mobile `beforeBreadcrumb`. Breadcrumbs are synced to the native layer and sent with native
 * crashes, which never pass through `beforeSend`, so this is the only scrub they get. Gives null
 * for a breadcrumb that must not be recorded, like a console call below a warning.
 */
export const filterCrashReportBreadcrumb = (breadcrumb: Breadcrumb): Breadcrumb | null => {
  // Touch breadcrumbs carry the text of the touched element, like seed words or balances.
  if (breadcrumb.category === TOUCH_BREADCRUMB_CATEGORY) return null

  const isConsoleBreadcrumb = breadcrumb.category === CONSOLE_BREADCRUMB_CATEGORY
  const isReportedConsoleLevel =
    !!breadcrumb.level && CONSOLE_BREADCRUMB_LEVELS.includes(breadcrumb.level)
  if (isConsoleBreadcrumb && !isReportedConsoleLevel) return null

  let scrubbedBreadcrumb: Breadcrumb
  try {
    scrubbedBreadcrumb = scrubSentryEventSecrets(
      isConsoleBreadcrumb ? prepareConsoleBreadcrumbForScrub(breadcrumb) : breadcrumb
    )
  } catch {
    // An unscrubbed breadcrumb can't be trusted, so it's dropped. Logging the failure would
    // create a console breadcrumb that lands right back here.
    return null
  }

  // Cut after scrubbing, so a secret split at the cut is still recognized in full.
  if (isConsoleBreadcrumb && scrubbedBreadcrumb.message) {
    scrubbedBreadcrumb.message = scrubbedBreadcrumb.message.slice(
      0,
      CONSOLE_BREADCRUMB_MESSAGE_MAX_LENGTH
    )
  }

  return scrubbedBreadcrumb
}

// The JS SDK sends a message's stack as a synthetic exception, and Sentry titles such an issue
// after the top function, like `captureMessage`, instead of the message. The native SDKs send it
// as the current thread instead, which keeps the stack for grouping and the message as the title.
const moveMessageStackToThread = <T extends SentryEvent>(event: T): T => {
  const isMessageEvent = !!event.message || !!event.logentry
  const syntheticException = event.exception?.values?.[0]
  if (!isMessageEvent || !syntheticException?.mechanism?.synthetic) return event

  const messageEvent: T = {
    ...event,
    threads: {
      values: [{ current: true, crashed: false, stacktrace: syntheticException.stacktrace }]
    }
  }
  delete messageEvent.exception
  return messageEvent
}

/**
 * The mobile `beforeSend`. Gives null when the user turned crash reporting off or the shared
 * pipeline drops the event. Otherwise gives back the scrubbed event, tagged as `unhandled` when
 * no capture site tagged it.
 */
export const processMobileCrashReportEvent = <T extends SentryEvent>(
  event: T,
  originalException: unknown,
  isConsentGiven: boolean
): T | null => {
  if (!isConsentGiven) return null

  const processedEvent = processCrashReportEvent(moveMessageStackToThread(event), originalException)
  if (!processedEvent) return null

  processedEvent.tags = {
    ...processedEvent.tags,
    content: processedEvent.tags?.content ?? CRASH_REPORT_CONTENT.UNHANDLED
  }

  return processedEvent
}

/**
 * Adds the `content` tag to a capture context. It's set per capture rather than on a scope,
 * because Hermes doesn't carry scopes across `await` and scope tags are synced to native crashes.
 */
export const withContentTag = (
  content: CrashReportContent,
  captureContext?: CrashReportCaptureContext
): CrashReportCaptureContext => ({
  ...captureContext,
  tags: { ...captureContext?.tags, content }
})
