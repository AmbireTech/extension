import { CRASH_ANALYTICS_WEB_CONFIG } from '@common/config/analytics/CrashAnalytics.web'
import { SENTRY_DSN_BROWSER_EXTENSION } from '@env'
import * as Sentry from '@sentry/react'
import { isExtension } from '@web/constants/browserapi'
import storage from '@web/extension-services/background/webapi/storage'

import { getUiType } from './uiType'

const { uiType } = getUiType()

// eslint-disable-next-line no-console
const consoleWarn = console.warn
const SUPPRESSED_WARNINGS = [
  // 2 <Routes > components are rendered in the tree at the same time to allow for lazy loading.
  'No routes matched location',
  'setNativeProps is deprecated. Please update props using React state instead.',
  'Animated: `useNativeDriver` is not supported because the native animated module is missing. Falling back to JS-based animation.'
]

// eslint-disable-next-line no-console
console.warn = function filterWarnings(msg, ...args) {
  if (!SUPPRESSED_WARNINGS.some((entry) => msg?.includes(entry))) {
    consoleWarn(msg, ...args)
  }
}

// Initialize Sentry conditionally based on the user's
// settings. The user preference will take effect after
// reloading the page or opening a new tab.
const initializeSentry = async () => {
  if (!isExtension) return

  if (!SENTRY_DSN_BROWSER_EXTENSION) {
    console.warn('Sentry DSN for browser extension is not defined. Sentry will not be initialized.')
    return
  }

  const isEnabled = await storage.get('crashAnalyticsEnabled', false)

  if (!isEnabled) return

  Sentry.init({
    ...CRASH_ANALYTICS_WEB_CONFIG,
    initialScope: {
      tags: {
        content: 'ui',
        uiType
      }
    }
  })
}

initializeSentry()
