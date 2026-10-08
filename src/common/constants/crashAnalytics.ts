/**
 * Since v5.21.2, we store the crash analytics enabled state in a new storage key
 * to avoid conflicts with the previous storage key. Prev key: 'crashAnalyticsEnabled'.
 */
export const CRASH_ANALYTICS_ENABLED_STORAGE_KEY = 'crashAnalyticsEnabledV2'

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

export const TOUCH_BREADCRUMB_CATEGORY = 'touch'

export const CONSOLE_BREADCRUMB_CATEGORY = 'console'

/** Console breadcrumb messages are cut to this many characters before they leave the device. */
export const CONSOLE_BREADCRUMB_MESSAGE_MAX_LENGTH = 500

export const TURBO_MODULE_CONTEXT_INTEGRATION_NAME = 'TurboModuleContext'

export const CULTURE_CONTEXT_INTEGRATION_NAME = 'CultureContext'

/** Tag that tells which OTA update a crash happened on. */
export const OTA_VERSION_TAG = 'otaVersion'

/** The `otaVersion` tag of the bundle that shipped with the store build, before any OTA update. */
export const OTA_VERSION_DEFAULT = 'default'
