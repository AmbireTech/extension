import type { SeverityLevel } from '@sentry/browser'

/**
 * Since v5.21.2, we store the crash analytics enabled state in a new storage key
 * to avoid conflicts with the previous storage key. Prev key: 'crashAnalyticsEnabled'.
 */
export const CRASH_ANALYTICS_ENABLED_STORAGE_KEY = 'crashAnalyticsEnabledV2'

/**
 * Where the random crash report id is stored. The id is what the user can share with support to
 * have their reports found in Sentry. It is not derived from anything else on the device.
 */
export const CRASH_REPORT_ID_STORAGE_KEY = 'crashReportId'

/**
 * The user id sent while no crash report id exists yet. The native Sentry SDKs fill an install id
 * of their own into reports that have no user id, and a fixed value keeps that from happening.
 */
export const CRASH_REPORT_ID_UNASSIGNED = 'unassigned'

/** Sentry tag keys of the account traits that replace the account address in crash reports. */
export const CRASH_REPORT_ACCOUNT_TAGS = {
  ACCOUNT_TYPE: 'accountType',
  KEY_TYPE: 'keyType',
  ACCOUNT_COUNT: 'accountCount'
} as const

export const PRIVACY_POOLS_CONTROLLER_NAME = 'PrivacyPoolsController'

/** The controllers whose updates can change the account traits sent with crash reports. */
export const CRASH_REPORT_ACCOUNT_TAG_CONTROLLERS = [
  'SelectedAccountController',
  'AccountsController',
  'KeystoreController'
]

export type CrashReportAccountTagKey =
  (typeof CRASH_REPORT_ACCOUNT_TAGS)[keyof typeof CRASH_REPORT_ACCOUNT_TAGS]

export const CRASH_REPORT_ACCOUNT_TYPE = {
  EOA: 'eoa',
  SMART: 'smart',
  SMARTER_EOA: '7702'
} as const

export const CRASH_REPORT_KEY_TYPE = {
  INTERNAL: 'internal',
  HARDWARE: 'hardware',
  NONE: 'none'
} as const

export const CRASH_REPORT_ACCOUNT_COUNT = {
  ONE: '1',
  FEW: '2-5',
  MANY: '6+'
} as const

/** The most accounts that still fall in the `2-5` bucket. */
export const CRASH_REPORT_FEW_ACCOUNTS_MAX = 5

/**
 * Which part of the mobile app a crash report came from, sent as the `content` tag so issues can
 * be filtered by it. Errors that reach the global handlers get `UNHANDLED`.
 */
export const CRASH_REPORT_CONTENT = {
  UI: 'ui',
  CONTROLLERS: 'controllers',
  WEBVIEW: 'webview',
  UNHANDLED: 'unhandled'
} as const

export type CrashReportContent = (typeof CRASH_REPORT_CONTENT)[keyof typeof CRASH_REPORT_CONTENT]

/** Why the mobile crash reporter can't start in a build, whatever the user's choice. */
export const CRASH_ANALYTICS_UNAVAILABLE_REASON = {
  DEV_BUILD: 'devBuild',
  MISSING_DSN: 'missingDsn'
} as const

export type CrashAnalyticsUnavailableReason =
  (typeof CRASH_ANALYTICS_UNAVAILABLE_REASON)[keyof typeof CRASH_ANALYTICS_UNAVAILABLE_REASON]

export const TOUCH_BREADCRUMB_CATEGORY = 'touch'

export const CONSOLE_BREADCRUMB_CATEGORY = 'console'

/**
 * The only console breadcrumb levels kept. Lower ones are dropped before the secret scrub, which
 * would otherwise run on the UI thread for every log call.
 */
export const CONSOLE_BREADCRUMB_LEVELS: readonly SeverityLevel[] = ['warning', 'error', 'fatal']

/** Console breadcrumb messages are cut to this many characters before they leave the device. */
export const CONSOLE_BREADCRUMB_MESSAGE_MAX_LENGTH = 500

/**
 * How far past the length cut a console breadcrumb is still scrubbed, so a secret that starts
 * before the cut is found in full. Well above the longest secret the scrub finds, a 24-word seed
 * phrase of about 215 characters.
 */
export const CONSOLE_BREADCRUMB_SCRUB_MARGIN = 500

export const TURBO_MODULE_CONTEXT_INTEGRATION_NAME = 'TurboModuleContext'

export const CULTURE_CONTEXT_INTEGRATION_NAME = 'CultureContext'

/** Tag that tells which OTA update a crash happened on. */
export const OTA_VERSION_TAG = 'otaVersion'

/**
 * The `otaVersion` tag until Stallion's server returns the running bundle's version. It stays for
 * the whole session on the store bundle, offline, or when that request fails.
 */
export const OTA_VERSION_UNKNOWN = 'unknown'
