import EventEmitter from '@ambire-common/controllers/eventEmitter/eventEmitter'
import { IEventEmitterRegistryController } from '@ambire-common/interfaces/eventEmitter'

// eslint-disable-next-line @typescript-eslint/naming-convention
export enum AUTO_LOCK_TIMES {
  never = 0, // never
  _7days = 10080, // 7 days in minutes
  _1day = 1440, // 1 day in minutes
  _8hours = 480, // 8 hours in minutes
  _1hour = 60, // 1 hour in minutes
  _10minutes = 10 // 10 minutes
}

export declare class AutoLockController extends EventEmitter {
  isReady: boolean

  autoLockTime: AUTO_LOCK_TIMES

  constructor(eventEmitterRegistry: IEventEmitterRegistryController, onAutoLock: () => void)

  setLastActiveTime(): void

  setAutoLockTime(newValue: AUTO_LOCK_TIMES): void

  toJSON(): any
}
