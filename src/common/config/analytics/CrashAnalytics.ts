import { Platform } from 'react-native'

import {
  excludeIntegrationsByName,
  logSentryDeliveryWhenTesting
} from '@common/config/analytics/crashReportHelpers'
import {
  CrashReportCaptureContext,
  filterCrashReportBreadcrumb,
  getCrashAnalyticsUnavailableReason,
  getMobileCrashReportRelease,
  processMobileCrashReportEvent,
  withContentTag
} from '@common/config/analytics/mobileCrashReportHooks'
import CONFIG, {
  APP_VERSION,
  BUILD_NUMBER,
  isDebugBuild,
  isDev,
  isTesting
} from '@common/config/env'
import {
  CRASH_ANALYTICS_ENABLED_STORAGE_KEY,
  CRASH_REPORT_CONTENT,
  CRASH_REPORT_ID_STORAGE_KEY,
  CRASH_REPORT_ID_UNASSIGNED,
  TURBO_MODULE_CONTEXT_INTEGRATION_NAME
} from '@common/constants/crashAnalytics'
// This file only runs on mobile, the extension and the websites resolve CrashAnalytics.web.ts
import { getStorageValueSync } from '@common/services/storage/storage.native'
import * as Sentry from '@sentry/react-native'

// `APP_ENV` alone isn't enough, because `yarn start:production` runs a debug build with it set to
// production, and its reports would mix with real users' crashes.
const isDevBuild = isDev || isDebugBuild

/**
 * Anonymous crash reporting is on by default outside development, the same privacy policy as
 * the extension. The Firefox first-run opt-in doesn't apply on mobile.
 */
export const CRASH_ANALYTICS_ENABLED_DEFAULT = !isDevBuild

// Read before init, because native crashes and the fatal JS errors stored for the next launch
// can't be held back from JS once the SDK runs.
let isCrashAnalyticsEnabled = getStorageValueSync(
  CRASH_ANALYTICS_ENABLED_STORAGE_KEY,
  CRASH_ANALYTICS_ENABLED_DEFAULT
)

// Kept here because `beforeSend` has no access to the controllers
let isPrivacyPoolsAccountSelected = false

/** Why crash reporting can't start in this build. Null when only the user's choice decides it. */
export const crashAnalyticsUnavailableReason = getCrashAnalyticsUnavailableReason({
  dsn: CONFIG.SENTRY_DSN_MOBILE,
  isDevBuild
})

if (!crashAnalyticsUnavailableReason && isCrashAnalyticsEnabled) {
  Sentry.init({
    dsn: CONFIG.SENTRY_DSN_MOBILE,
    environment: CONFIG.APP_ENV,
    release: getMobileCrashReportRelease(Platform.OS, APP_VERSION),
    dist: BUILD_NUMBER,
    // Disables sending personally identifiable information. `dataCollection` must stay unset,
    // because setting it switches every other privacy default to permissive.
    sendDefaultPii: false,
    // On by default since SDK 10.x, it would send every console call as a log entry
    enableLogs: false,
    // On by default in the native SDKs, it would report every app start, not only crashes
    enableAutoSessionTracking: false,
    // Reports the SDK's own delivery failures instead of swallowing them
    debug: isTesting,
    attachScreenshot: false,
    attachViewHierarchy: false,
    reportAccessibilityIdentifier: false,
    // TurboModuleContext writes every native module call into a scope that's synced to native
    // crashes, unscrubbed.
    integrations: (defaultIntegrations) =>
      excludeIntegrationsByName(defaultIntegrations, [TURBO_MODULE_CONTEXT_INTEGRATION_NAME]),
    initialScope: {
      user: {
        id: getStorageValueSync(CRASH_REPORT_ID_STORAGE_KEY, '') || CRASH_REPORT_ID_UNASSIGNED
      }
    },
    beforeBreadcrumb: filterCrashReportBreadcrumb,
    beforeSend: (event, hint) =>
      processMobileCrashReportEvent(
        event,
        hint.originalException,
        isCrashAnalyticsEnabled,
        isPrivacyPoolsAccountSelected
      )
  })

  logSentryDeliveryWhenTesting(Sentry.getClient())
}

/** Tells `beforeSend` whether a Privacy Pools account is selected, so it strips those reports. */
export const syncPrivacyPoolsAccountSelected = (isSelected: boolean) => {
  isPrivacyPoolsAccountSelected = isSelected
}

/**
 * Applies the user's crash reporting choice while the app runs. Turning it off stops sending right
 * away. Turning it on applies from the next launch, the only point where the SDK and its native
 * crash handler start.
 */
export const syncCrashAnalyticsConsent = (isEnabled: boolean) => {
  if (isEnabled === isCrashAnalyticsEnabled) return

  isCrashAnalyticsEnabled = isEnabled
  if (isEnabled) return

  Sentry.close().catch((error: unknown) => {
    console.error('Crash reporting could not be stopped after the user turned it off', error)
  })
}

export const captureException = (exception: unknown, captureContext?: CrashReportCaptureContext) =>
  Sentry.captureException(exception, withContentTag(CRASH_REPORT_CONTENT.UI, captureContext))

export const captureMessage = (message: string, captureContext?: CrashReportCaptureContext) =>
  Sentry.captureMessage(message, withContentTag(CRASH_REPORT_CONTENT.UI, captureContext))

export const captureControllerException = (
  exception: unknown,
  captureContext?: CrashReportCaptureContext
) =>
  Sentry.captureException(
    exception,
    withContentTag(CRASH_REPORT_CONTENT.CONTROLLERS, captureContext)
  )

export const captureWebViewException = (
  exception: unknown,
  captureContext?: CrashReportCaptureContext
) =>
  Sentry.captureException(exception, withContentTag(CRASH_REPORT_CONTENT.WEBVIEW, captureContext))

export const captureWebViewMessage = (
  message: string,
  captureContext?: CrashReportCaptureContext
) => Sentry.captureMessage(message, withContentTag(CRASH_REPORT_CONTENT.WEBVIEW, captureContext))

/**
 * Puts the crash report id on later reports, native crashes included. Without a user id the
 * native SDKs fill in an install id of their own, so a fixed placeholder is set when there is no id.
 */
export const setCrashReportId = (crashReportId: string | null) =>
  Sentry.setUser({ id: crashReportId || CRASH_REPORT_ID_UNASSIGNED })

/** Sets a tag on every later report, native crashes included, since it's synced to the native layer. */
export const setTagContext = Sentry.setTag
