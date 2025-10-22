/* eslint-disable @typescript-eslint/no-floating-promises */
import EventEmitter from '@ambire-common/controllers/eventEmitter/eventEmitter'
import {
  CRASH_ANALYTICS_ENABLED_DEFAULT,
  CRASH_ANALYTICS_ENABLED_STORAGE_KEY
} from '@common/config/analytics/CrashAnalytics.web'
import { APP_VERSION } from '@common/config/env'
import { DEFAULT_THEME, ThemeType } from '@common/styles/themeConfig'
import { browser, isSafari } from '@web/constants/browserapi'
import { storage } from '@web/extension-services/background/webapi/storage'
import { DEFAULT_LOG_LEVEL, LOG_LEVELS, setLoggerInstanceLogLevel } from '@web/utils/logger'

export class WalletStateController extends EventEmitter {
  isReady: boolean = false

  isPinned: boolean = false

  #isPinnedTimeout: ReturnType<typeof setTimeout> | undefined = undefined

  #isSetupComplete: boolean = false

  themeType: ThemeType = DEFAULT_THEME

  logLevel: LOG_LEVELS = DEFAULT_LOG_LEVEL

  crashAnalyticsEnabled: boolean = CRASH_ANALYTICS_ENABLED_DEFAULT

  // Holds the initial load promise, so that one can wait until it completes
  initialLoadPromise: Promise<void>

  extensionVersion: string = APP_VERSION

  #onLogLevelUpdateCallback: (logLevel: LOG_LEVELS) => Promise<void>

  get isSetupComplete() {
    return this.#isSetupComplete
  }

  set isSetupComplete(newValue: boolean) {
    this.#isSetupComplete = newValue
    storage.set('isSetupComplete', newValue)
    this.emitUpdate()
  }

  constructor({
    onLogLevelUpdateCallback
  }: {
    onLogLevelUpdateCallback: (logLevel: LOG_LEVELS) => Promise<void>
  }) {
    super()

    this.#onLogLevelUpdateCallback = onLogLevelUpdateCallback
    this.initialLoadPromise = this.#init()
  }

  async #init(): Promise<void> {
    this.#isSetupComplete = await storage.get('isSetupComplete', false)
    this.themeType = await storage.get('themeType', DEFAULT_THEME)
    this.isPinned = await this.#checkIsPinned()
    if (!this.isPinned) this.#initContinuousCheckIsPinned()

    this.logLevel = await storage.get('logLevel', this.logLevel)
    if (this.logLevel !== DEFAULT_LOG_LEVEL) setLoggerInstanceLogLevel(this.logLevel)

    this.crashAnalyticsEnabled = await storage.get(
      CRASH_ANALYTICS_ENABLED_STORAGE_KEY,
      this.crashAnalyticsEnabled
    )

    this.isReady = true
    this.emitUpdate()
  }

  async #checkIsPinned() {
    if (isSafari()) return false

    try {
      const userSettings = await browser.action.getUserSettings()
      return (userSettings.isOnToolbar as boolean) || false
    } catch (error) {
      return false
    }
  }

  async #initContinuousCheckIsPinned() {
    const isPinned = await this.#checkIsPinned()

    if (isPinned) {
      this.isPinned = true
      !!this.#isPinnedTimeout && clearTimeout(this.#isPinnedTimeout)
      this.emitUpdate()

      return
    }

    this.#isPinnedTimeout = setTimeout(this.#initContinuousCheckIsPinned.bind(this), 1000)
  }

  async setThemeType(type: ThemeType) {
    this.themeType = type
    await storage.set('themeType', type)

    this.emitUpdate()
  }

  async setLogLevel(nextLogLevel: LOG_LEVELS) {
    this.logLevel = nextLogLevel
    setLoggerInstanceLogLevel(nextLogLevel)
    await storage.set('logLevel', nextLogLevel)
    await this.#onLogLevelUpdateCallback(nextLogLevel)

    this.emitUpdate()
  }

  async setCrashAnalytics(enabled: boolean) {
    this.crashAnalyticsEnabled = enabled
    this.emitUpdate()

    await storage.set(CRASH_ANALYTICS_ENABLED_STORAGE_KEY, enabled)
  }

  toJSON() {
    return {
      ...this,
      ...super.toJSON(),
      isPinned: this.isPinned,
      isSetupComplete: this.isSetupComplete
    }
  }
}
