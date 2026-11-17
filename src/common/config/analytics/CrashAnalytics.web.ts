import { excludeIntegrationsByName } from '@common/config/analytics/crashReportHelpers'
import {
  processCrashReportEvent,
  stripPrivacyPoolsCrashReportEvent
} from '@common/config/analytics/processCrashReportEvent'
import CONFIG, { APP_VERSION, isAmbireNext, isDev, isTesting } from '@common/config/env'
import {
  CrashAnalyticsUnavailableReason,
  CULTURE_CONTEXT_INTEGRATION_NAME
} from '@common/constants/crashAnalytics'
import * as Sentry from '@sentry/react'
import { IS_FIREFOX } from '@web/constants/common'

// Kept here because `beforeSend` has no access to the controllers
let isPrivacyPoolsAccountSelected = false

export const CRASH_ANALYTICS_WEB_CONFIG: Sentry.BrowserOptions = {
  dsn: CONFIG.SENTRY_DSN_BROWSER_EXTENSION,
  environment: CONFIG.APP_ENV as string,
  // Ambire Next is a second production webkit build carrying the very same
  // version, so it needs a release of its own - otherwise its events and source
  // maps land in the stable build's release. Must stay in sync with the release
  // name that scripts/build-extensions.sh uploads the source maps under.
  release: `extension-${isAmbireNext ? 'next-' : ''}${process.env.WEB_ENGINE}@${APP_VERSION}`,
  // Disables sending personally identifiable information
  sendDefaultPii: false,
  // The SDK's newer CultureContext default would add the user's locale and timezone to every event
  integrations: (defaultIntegrations) =>
    excludeIntegrationsByName(defaultIntegrations, [CULTURE_CONTEXT_INTEGRATION_NAME]),
  // Sentry is doing some extra work to make sure the fetch it finds is the right one, but it
  // doesn't work under LavaMoat so we pass it the fetch used in that context.
  transport: (options) => Sentry.makeFetchTransport(options, (...args) => fetch(...args)),
  // Reports the SDK's own delivery failures instead of swallowing them
  debug: isTesting,
  // No explicit `event` param type here: annotating this object as
  // Sentry.BrowserOptions lets `event`'s type be inferred contextually as the
  // narrower `ErrorEvent`, which processCrashReportEvent (generic) then
  // preserves in its return type -- an explicit `event: Sentry.Event` param
  // widens both to the general Event union, which BrowserOptions rejects.
  beforeSend(event, hint) {
    const processedEvent = processCrashReportEvent(event, hint?.originalException)
    if (processedEvent) {
      stripPrivacyPoolsCrashReportEvent(processedEvent, isPrivacyPoolsAccountSelected)
    }

    return processedEvent
  }
}

/** Tells `beforeSend` whether a Privacy Pools account is selected, so it strips those reports. */
export const syncPrivacyPoolsAccountSelected = (isSelected: boolean) => {
  isPrivacyPoolsAccountSelected = isSelected
}

/**
 * Stops the UI's crash reports right away when the user turns them off. Turning them on applies
 * from the next page load, the only point where Sentry starts in the UI.
 */
export const syncCrashAnalyticsConsent = (isEnabled: boolean) => {
  if (isEnabled) return

  Sentry.close().catch((error: unknown) => {
    console.error('Crash reporting could not be stopped after the user turned it off', error)
  })
}

export const captureException = Sentry.captureException
export const captureMessage = Sentry.captureMessage

/** Puts the crash report id on later reports, or removes the user when there is none. */
export const setCrashReportId = (crashReportId: string | null) =>
  Sentry.setUser(crashReportId ? { id: crashReportId } : null)

export const setTagContext = Sentry.setTag
export const ErrorBoundary = Sentry.ErrorBoundary

/**
 * Since v5.15.0, we enable anonymous crash reporting by default,
 * because that's part of our privacy policy now.
 * Except in development. Even tho we tag errors with the environment,
 * we don't want to spam Sentry with errors that occur during development.
 * Since v5.21.2, disabled by default for Firefox. The flow must be different -
 * control mechanism must be shown at first-run of the add-on and should
 * contain a choice accompanied by the data collection summary.
 */
export const CRASH_ANALYTICS_ENABLED_DEFAULT = !isDev && !IS_FIREFOX

/** Always null, only the mobile app reports why crash reporting can't start. */
export const crashAnalyticsUnavailableReason: CrashAnalyticsUnavailableReason | null = null
