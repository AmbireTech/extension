import i18n from 'i18next'

import EventEmitter from '@ambire-common/controllers/eventEmitter/eventEmitter'
import { IEventEmitterRegistryController } from '@ambire-common/interfaces/eventEmitter'
import { browser } from '@web/constants/browserapi'
import { storage } from '@web/extension-services/background/webapi/storage'

export const ALARMS_AUTO_LOCK = 'ALARMS_AUTO_LOCK'

// eslint-disable-next-line @typescript-eslint/naming-convention
export enum AUTO_LOCK_TIMES {
  never = 0, // never
  _7days = 10080, // 7 days in minutes
  _1day = 1440, // 1 day in minutes
  _8hours = 480, // 8 hours in minutes
  _1hour = 60, // 1 hour in minutes
  _10minutes = 10 // 10 minutes
}

export const getAutoLockLabel = (time: AUTO_LOCK_TIMES) => {
  if (time === AUTO_LOCK_TIMES._7days) return i18n.t('7 days')
  if (time === AUTO_LOCK_TIMES._1day) return i18n.t('1 day')
  if (time === AUTO_LOCK_TIMES._8hours) return i18n.t('8 hours')
  if (time === AUTO_LOCK_TIMES._1hour) return i18n.t('1 hour')
  if (time === AUTO_LOCK_TIMES._10minutes) return i18n.t('10 minutes')

  return i18n.t('Never')
}

export class AutoLockController extends EventEmitter {
  isReady: boolean = false

  #_autoLockTime: AUTO_LOCK_TIMES = 0 // number in minutes

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

  toJSON() {
    return {
      ...this,
      ...super.toJSON(),
      autoLockTime: this.autoLockTime
    }
  }
}

export default AutoLockController
