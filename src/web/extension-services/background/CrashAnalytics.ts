import { CRASH_ANALYTICS_WEB_CONFIG } from '@common/config/analytics/CrashAnalytics.web'
import * as Sentry from '@sentry/browser'

// Service worker specific Sentry configuration that avoids browser event listeners
export const CRASH_ANALYTICS_BACKGROUND_CONFIG: Sentry.BrowserOptions = {
  ...CRASH_ANALYTICS_WEB_CONFIG,
  initialScope: {
    tags: {
      content: 'background'
    }
  },
  // Passing only a few integrations in the integrations array without setting
  // `defaultIntegrations: false` overrides those defaults for the ones you specify only
  integrations: [
    // Disable integrations that add browser event listeners which are not compatible with service workers
    Sentry.breadcrumbsIntegration({
      history: false, // Disable history instrumentation that adds popstate listeners
      xhr: true,
      fetch: true,
      console: true,
      dom: false, // Disable DOM event instrumentation
      sentry: true
    })
  ]
}

export const captureBackgroundException = Sentry.captureException
export const captureBackgroundMessage = Sentry.captureMessage
export const setBackgroundExtraContext = Sentry.setExtra
export const setBackgroundUserContext = Sentry.setUser
