import EventEmitter from '@ambire-common/controllers/eventEmitter/eventEmitter'
import { IEventEmitterRegistryController } from '@ambire-common/interfaces/eventEmitter'

import { AUTO_LOCK_TIMES } from './auto-lock.constants'

export declare class AutoLockController extends EventEmitter {
  isReady: boolean

  autoLockTime: AUTO_LOCK_TIMES

  constructor(eventEmitterRegistry: IEventEmitterRegistryController, onAutoLock: () => void)

  setLastActiveTime(): void

  setAutoLockTime(newValue: AUTO_LOCK_TIMES): void

  toJSON(): any
}
