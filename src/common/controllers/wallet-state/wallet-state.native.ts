/* eslint-disable @typescript-eslint/no-floating-promises */
import EventEmitter from '@ambire-common/controllers/eventEmitter/eventEmitter'
import { IEventEmitterRegistryController } from '@ambire-common/interfaces/eventEmitter'
import {
  CRASH_ANALYTICS_ENABLED_DEFAULT,
  CRASH_ANALYTICS_ENABLED_STORAGE_KEY
} from '@common/config/analytics/CrashAnalytics.web'
import { APP_VERSION } from '@common/config/env'
import { storage } from '@common/services/storage'
import { DEFAULT_THEME, THEME_TYPES } from '@common/styles/theme/types'
import { ThemeType } from '@common/styles/themeConfig'
import { DEFAULT_LOG_LEVEL, LOG_LEVELS, setLoggerInstanceLogLevel } from '@common/utils/logger'

import { WalletStateController as IWalletStateController } from './wallet-state'

export type AvatarType = 'blockies' | 'jazzicons' | 'polycons' | 'ens'

export class WalletStateController extends EventEmitter implements IWalletStateController {
  isReady: boolean = false

  isPinned: boolean = true

  #isSetupComplete: boolean = false

  isPrivacyModeEnabled: boolean = false

  themeType: ThemeType = THEME_TYPES.SYSTEM

  avatarType: AvatarType = 'jazzicons'

  logLevel: LOG_LEVELS = LOG_LEVELS.DEV

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
    eventEmitterRegistry,
    onLogLevelUpdateCallback
  }: {
    eventEmitterRegistry: IEventEmitterRegistryController
    onLogLevelUpdateCallback: (logLevel: LOG_LEVELS) => Promise<void>
  }) {
    super(eventEmitterRegistry)

    this.#onLogLevelUpdateCallback = onLogLevelUpdateCallback
    this.initialLoadPromise = this.#init()
  }

  async #init(): Promise<void> {
    this.themeType = await storage.get('themeType', DEFAULT_THEME)
    this.avatarType = await storage.get('avatarType', this.avatarType)
    this.isPrivacyModeEnabled = await storage.get('isPrivacyModeEnabled', this.isPrivacyModeEnabled)

    this.logLevel = await storage.get('logLevel', this.logLevel)
    if (this.logLevel !== DEFAULT_LOG_LEVEL) setLoggerInstanceLogLevel(this.logLevel)

    this.crashAnalyticsEnabled = await storage.get(
      CRASH_ANALYTICS_ENABLED_STORAGE_KEY,
      this.crashAnalyticsEnabled
    )

    this.isReady = true
    this.emitUpdate()
  }

  setIsSetupComplete(isSetupComplete: boolean) {
    this.#isSetupComplete = isSetupComplete
  }

  async setThemeType(type: ThemeType) {
    this.themeType = type
    await storage.set('themeType', type)

    this.emitUpdate()
  }

  async setAvatarType(type: AvatarType) {
    this.avatarType = type
    await storage.set('avatarType', type)

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

  async togglePrivacyMode() {
    this.isPrivacyModeEnabled = !this.isPrivacyModeEnabled
    await storage.set('isPrivacyModeEnabled', this.isPrivacyModeEnabled)
    this.emitUpdate()
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
