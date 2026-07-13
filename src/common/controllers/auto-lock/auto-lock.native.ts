import EventEmitter from '@ambire-common/controllers/eventEmitter/eventEmitter'
import { IEventEmitterRegistryController } from '@ambire-common/interfaces/eventEmitter'
import { Storage } from '@ambire-common/interfaces/storage'

import { AutoLockController as IAutoLockController } from './auto-lock'
import { AUTO_LOCK_TIMES } from './auto-lock.constants'

export class AutoLockController extends EventEmitter implements IAutoLockController {
  isReady: boolean = false

  #storage: Storage

  #_autoLockTime: AUTO_LOCK_TIMES = AUTO_LOCK_TIMES.never // number in minutes

  get autoLockTime() {
    return this.#_autoLockTime
  }
  set autoLockTime(newValue: AUTO_LOCK_TIMES) {
    this.#_autoLockTime = newValue
    this.#storage.set('autoLockTime', newValue)
    this.emitUpdate()
  }

  #onAutoLock: () => void

  #timer: ReturnType<typeof setTimeout> | undefined = undefined

  constructor(
    eventEmitterRegistry: IEventEmitterRegistryController,
    onAutoLock: () => void,
    storage: Storage
  ) {
    super(eventEmitterRegistry)
    this.#storage = storage
    this.#onAutoLock = onAutoLock
    this.#init()
  }

  async #init(): Promise<void> {
    this.#_autoLockTime = await this.#storage.get('autoLockTime', AUTO_LOCK_TIMES.never)

    this.isReady = true
    this.emitUpdate()
  }

  #resetTimer() {
    if (this.#timer) clearTimeout(this.#timer)

    if (this.autoLockTime === AUTO_LOCK_TIMES.never) return

    this.#timer = setTimeout(
      () => {
        this.#onAutoLock()
      },
      this.autoLockTime * 60 * 1000
    )
  }

  setLastActiveTime() {
    this.#resetTimer()
  }

  setAutoLockTime(newValue: AUTO_LOCK_TIMES) {
    this.autoLockTime = newValue
  }

  toJSON() {
    return {
      ...this,
      ...super.toJSON(),
      autoLockTime: this.autoLockTime
    }
  }
}

export default AutoLockController
