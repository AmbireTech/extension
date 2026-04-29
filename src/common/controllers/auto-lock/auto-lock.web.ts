import EventEmitter from '@ambire-common/controllers/eventEmitter/eventEmitter'
import { IEventEmitterRegistryController } from '@ambire-common/interfaces/eventEmitter'
import { storage } from '@common/services/storage'
import { browser } from '@web/constants/browserapi'

import { AutoLockController as IAutoLockController } from './auto-lock'
import { ALARMS_AUTO_LOCK, AUTO_LOCK_TIMES } from './auto-lock.constants'

export class AutoLockController extends EventEmitter implements IAutoLockController {
  isReady: boolean = false

  #_autoLockTime: AUTO_LOCK_TIMES = AUTO_LOCK_TIMES.never // number in minutes

  get autoLockTime() {
    return this.#_autoLockTime
  }

  set autoLockTime(newValue: AUTO_LOCK_TIMES) {
    this.#_autoLockTime = newValue
    storage.set('autoLockTime', newValue)
    this.emitUpdate()
  }

  #onAutoLock: () => void

  constructor(eventEmitterRegistry: IEventEmitterRegistryController, onAutoLock: () => void) {
    super(eventEmitterRegistry)
    this.#onAutoLock = onAutoLock
    this.#init()
  }

  async #init(): Promise<void> {
    this.#_autoLockTime = await storage.get('autoLockTime', AUTO_LOCK_TIMES.never)

    this.isReady = true
    this.emitUpdate()
  }

  #resetTimer() {
    browser.alarms.clear(ALARMS_AUTO_LOCK)

    if (!this.autoLockTime) return

    browser.alarms.create(ALARMS_AUTO_LOCK, {
      delayInMinutes: this.autoLockTime,
      periodInMinutes: this.autoLockTime
    })
    browser.alarms.onAlarm.addListener((alarm: chrome.alarms.Alarm) => {
      if (alarm.name === ALARMS_AUTO_LOCK) {
        this.#onAutoLock()
        browser.alarms.clear(ALARMS_AUTO_LOCK)
      }
    })
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
