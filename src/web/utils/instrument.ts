import {
  captureException,
  CRASH_ANALYTICS_ENABLED_DEFAULT,
  CRASH_ANALYTICS_ENABLED_STORAGE_KEY,
  CRASH_ANALYTICS_WEB_CONFIG,
  logSentryDeliveryWhenTesting
} from '@common/config/analytics/CrashAnalytics.web'
import { isDev, isTesting } from '@common/config/env'
import { storage } from '@common/services/storage'
import { getUiType } from '@common/utils/uiType'
import { SENTRY_DSN_BROWSER_EXTENSION } from '@env'
import * as Sentry from '@sentry/react'
import { browser, isExtension } from '@web/constants/browserapi'
import { IS_FIREFOX } from '@web/constants/common'

const { uiType } = getUiType()

// Initialize Sentry conditionally based on the user's
// settings. The user preference will take effect after
// reloading the page or opening a new tab.
const initializeSentry = async () => {
  if (!isExtension) return

  if (!SENTRY_DSN_BROWSER_EXTENSION) {
    console.warn('Sentry DSN for browser extension is not defined. Sentry will not be initialized.')
    return
  }

  const isEnabled = await storage.get(
    CRASH_ANALYTICS_ENABLED_STORAGE_KEY,
    CRASH_ANALYTICS_ENABLED_DEFAULT
  )

  if (!isEnabled) {
    // Crash reporting is off by design in development builds and on Firefox. Saying so keeps
    // "disabled on purpose" distinguishable from "silently broken" when no event ever shows up.
    if (isDev || IS_FIREFOX) {
      console.info(
        `Crash reporting is intentionally disabled in this build (${
          isDev ? 'development build' : 'Firefox'
        }). No events will be sent to Sentry.`
      )
    }
    return
  }

  Sentry.init({
    ...CRASH_ANALYTICS_WEB_CONFIG,
    initialScope: {
      tags: {
        content: 'ui',
        uiType
      }
    }
  })

  logSentryDeliveryWhenTesting(Sentry.getClient())

  // Most of the app reports through `captureException` rather than by letting an error reach
  // the global handlers, so the crash-analytics e2e spec needs a way to exercise that path.
  // Unreachable outside a testing build.
  if (isTesting) {
    browser.runtime.onMessage.addListener((message: any) => {
      if (message?.type !== 'ambire-extension-test-capture-exception-ui') return

      captureException(new Error(message.errorMessage))
    })
  }
}

initializeSentry()
