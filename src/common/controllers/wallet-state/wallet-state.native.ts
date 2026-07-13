/* eslint-disable @typescript-eslint/no-floating-promises */
import EventEmitter from '@ambire-common/controllers/eventEmitter/eventEmitter'
import { IEventEmitterRegistryController } from '@ambire-common/interfaces/eventEmitter'
import { Storage } from '@ambire-common/interfaces/storage'
import {
  CRASH_ANALYTICS_ENABLED_DEFAULT,
  CRASH_ANALYTICS_ENABLED_STORAGE_KEY
} from '@common/config/analytics/CrashAnalytics.web'
import { APP_VERSION } from '@common/config/env'
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

  logLevel: LOG_LEVELS = DEFAULT_LOG_LEVEL

  crashAnalyticsEnabled: boolean = CRASH_ANALYTICS_ENABLED_DEFAULT

  // Holds the initial load promise, so that one can wait until it completes
  initialLoadPromise: Promise<void>

  extensionVersion: string = APP_VERSION

  #storage: Storage

  #onLogLevelUpdateCallback: (logLevel: LOG_LEVELS) => Promise<void>

  get isSetupComplete() {
    return this.#isSetupComplete
  }

  set isSetupComplete(newValue: boolean) {
    this.#isSetupComplete = newValue
    this.#storage.set('isSetupComplete', newValue)
    this.emitUpdate()
  }

  constructor({
    eventEmitterRegistry,
    onLogLevelUpdateCallback,
    storage
  }: {
    eventEmitterRegistry: IEventEmitterRegistryController
    onLogLevelUpdateCallback: (logLevel: LOG_LEVELS) => Promise<void>
    storage: Storage
  }) {
    super(eventEmitterRegistry)

    this.#storage = storage
    this.#onLogLevelUpdateCallback = onLogLevelUpdateCallback
    this.initialLoadPromise = this.#init()
  }

  async #init(): Promise<void> {
    this.themeType = (await this.#storage.get('themeType', DEFAULT_THEME)) as ThemeType
    this.avatarType = (await this.#storage.get('avatarType', this.avatarType)) as AvatarType
    this.isPrivacyModeEnabled = await this.#storage.get(
      'isPrivacyModeEnabled',
      this.isPrivacyModeEnabled
    )

    this.logLevel = (await this.#storage.get('logLevel', this.logLevel)) as LOG_LEVELS
    if (this.logLevel !== DEFAULT_LOG_LEVEL) setLoggerInstanceLogLevel(this.logLevel)

    this.crashAnalyticsEnabled = await this.#storage.get(
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
    await this.#storage.set('themeType', type)

    this.emitUpdate()
  }

  async setAvatarType(type: AvatarType) {
    this.avatarType = type
    await this.#storage.set('avatarType', type)

    this.emitUpdate()
  }

  async setLogLevel(nextLogLevel: LOG_LEVELS) {
    this.logLevel = nextLogLevel
    setLoggerInstanceLogLevel(nextLogLevel)
    await this.#storage.set('logLevel', nextLogLevel)
    await this.#onLogLevelUpdateCallback(nextLogLevel)

    this.emitUpdate()
  }

  async setCrashAnalytics(enabled: boolean) {
    this.crashAnalyticsEnabled = enabled
    this.emitUpdate()

    await this.#storage.set(CRASH_ANALYTICS_ENABLED_STORAGE_KEY, enabled)
  }

  async togglePrivacyMode() {
    this.isPrivacyModeEnabled = !this.isPrivacyModeEnabled
    await this.#storage.set('isPrivacyModeEnabled', this.isPrivacyModeEnabled)
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
