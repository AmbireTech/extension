import EventEmitter from '@ambire-common/controllers/eventEmitter/eventEmitter'
import { IEventEmitterRegistryController } from '@ambire-common/interfaces/eventEmitter'
import { ThemeType } from '@common/styles/themeConfig'
import { LOG_LEVELS } from '@common/utils/logger'

export type AvatarType = 'blockies' | 'jazzicons' | 'polycons' | 'ens'

export declare class WalletStateController extends EventEmitter {
  isReady: boolean

  isPinned: boolean

  isPrivacyModeEnabled: boolean

  themeType: ThemeType

  avatarType: AvatarType

  logLevel: LOG_LEVELS

  crashAnalyticsEnabled: boolean

  initialLoadPromise: Promise<void>

  extensionVersion: string

  isSetupComplete: boolean

  constructor({
    eventEmitterRegistry,
    onLogLevelUpdateCallback
  }: {
    eventEmitterRegistry: IEventEmitterRegistryController
    onLogLevelUpdateCallback: (logLevel: LOG_LEVELS) => Promise<void>
  })

  setIsSetupComplete(isSetupComplete: boolean): void

  setThemeType(type: ThemeType): Promise<void>

  setAvatarType(type: AvatarType): Promise<void>

  setLogLevel(nextLogLevel: LOG_LEVELS): Promise<void>

  setCrashAnalytics(enabled: boolean): Promise<void>

  togglePrivacyMode(): Promise<void>

  toJSON(): any
}
