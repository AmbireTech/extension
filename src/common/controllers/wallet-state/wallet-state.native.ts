/* eslint-disable @typescript-eslint/no-floating-promises */
import { nanoid } from 'nanoid'
import EventEmitter from '@ambire-common/controllers/eventEmitter/eventEmitter'
import { IEventEmitterRegistryController } from '@ambire-common/interfaces/eventEmitter'
import { Storage } from '@ambire-common/interfaces/storage'
import { CRASH_ANALYTICS_ENABLED_DEFAULT } from '@common/config/analytics/CrashAnalytics'
import { APP_VERSION } from '@common/config/env'
import {
  CRASH_ANALYTICS_ENABLED_STORAGE_KEY,
  CRASH_REPORT_ID_STORAGE_KEY
} from '@common/constants/crashAnalytics'
import { THEME_TYPES } from '@common/styles/theme/types'
import { ThemeType } from '@common/styles/themeConfig'
import { DEFAULT_LOG_LEVEL, LOG_LEVELS, setLoggerInstanceLogLevel } from '@common/utils/logger'

import { WalletStateController as IWalletStateController } from './wallet-state'

export type AvatarType = 'blockies' | 'jazzicons' | 'polycons' | 'ens'

export class WalletStateController extends EventEmitter implements IWalletStateController {
  isReady: boolean = false

  isPinned: boolean = true

  #isSetupComplete: boolean = false

  isPrivacyModeEnabled: boolean = false

  isSidePanelModeEnabled: boolean = false

  themeType: ThemeType = THEME_TYPES.SYSTEM

  avatarType: AvatarType = 'jazzicons'

  logLevel: LOG_LEVELS = DEFAULT_LOG_LEVEL

  crashAnalyticsEnabled: boolean = CRASH_ANALYTICS_ENABLED_DEFAULT

  /**
   * The random id that tags this install's crash reports, so support can find them when the user
   * shares it. It is null while crash analytics is off, and it changes each time it is turned on.
   */
  crashReportId: string | null = null

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
    this.themeType = (await this.#storage.get('themeType', this.themeType)) as ThemeType
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
    this.crashReportId = await this.#storage.get(CRASH_REPORT_ID_STORAGE_KEY, null)
    // Installs that had crash analytics on before the id existed get theirs here
    if (this.crashAnalyticsEnabled && !this.crashReportId) {
      this.crashReportId = nanoid()
      await this.#persistCrashReportId()
    }

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

  async #persistCrashReportId() {
    if (!this.crashReportId) {
      await this.#storage.remove(CRASH_REPORT_ID_STORAGE_KEY)
      return
    }

    await this.#storage.set(CRASH_REPORT_ID_STORAGE_KEY, this.crashReportId)
  }

  async setCrashAnalytics(enabled: boolean) {
    this.crashAnalyticsEnabled = enabled
    // Turning it on always gives a new id, so toggling off and on resets it
    this.crashReportId = enabled ? nanoid() : null
    this.emitUpdate()

    await this.#storage.set(CRASH_ANALYTICS_ENABLED_STORAGE_KEY, enabled)
    await this.#persistCrashReportId()
  }

  async togglePrivacyMode() {
    this.isPrivacyModeEnabled = !this.isPrivacyModeEnabled
    await this.#storage.set('isPrivacyModeEnabled', this.isPrivacyModeEnabled)
    this.emitUpdate()
  }

  async setSidePanelModeEnabled(_enabled: boolean) {
    // Chrome side panel mode is extension-only; no UI or persistence on mobile.
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
