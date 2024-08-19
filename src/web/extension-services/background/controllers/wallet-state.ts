/* eslint-disable @typescript-eslint/no-floating-promises */
import EventEmitter from '@ambire-common/controllers/eventEmitter/eventEmitter'
import { browser } from '@web/constants/browserapi'
import { storage } from '@web/extension-services/background/webapi/storage'

import {
  handleRegisterScripts,
  handleUnregisterAmbireInpageScript,
  handleUnregisterEthereumInpageScript
} from '../handlers/handleScripting'

export class WalletStateController extends EventEmitter {
  isReady: boolean = false

  #_isDefaultWallet: boolean = true

  #_onboardingState?: { version: string; viewedAt: number } = undefined

  #isPinned: boolean = true

  #isPinnedInterval: ReturnType<typeof setTimeout> | undefined = undefined

  #isSetupComplete: boolean = true

  get isDefaultWallet() {
    return this.#_isDefaultWallet
  }

  set isDefaultWallet(newValue: boolean) {
    this.#_isDefaultWallet = newValue
    storage.set('isDefaultWallet', newValue)

    if (newValue) {
      // if Ambire is the default wallet inject and reload the current tab
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      ;(async () => {
        await handleUnregisterAmbireInpageScript()
        await handleUnregisterEthereumInpageScript()
        await handleRegisterScripts(true)
        await this.#reloadPageOnSwitchDefaultWallet()
      })()
    } else {
      ;(async () => {
        // if Ambire is NOT the default wallet remove injection and reload the current tab
        await handleUnregisterEthereumInpageScript()
        await this.#reloadPageOnSwitchDefaultWallet()
      })()
    }
    this.emitUpdate()
  }

  get onboardingState() {
    return this.#_onboardingState
  }

  set onboardingState(newValue: { version: string; viewedAt: number } | undefined) {
    this.#_onboardingState = newValue
    storage.set('onboardingState', newValue)
    this.emitUpdate()
  }

  get isPinned() {
    return this.#isPinned
  }

  set isPinned(newValue: boolean) {
    this.#isPinned = newValue
    storage.set('isPinned', newValue)
    this.emitUpdate()
  }

  get isSetupComplete() {
    return this.#isSetupComplete
  }

  set isSetupComplete(newValue: boolean) {
    this.#isSetupComplete = newValue
    if (!newValue) {
      this.#initCheckIsPinned()
    } else {
      clearTimeout(this.#isPinnedInterval)
    }
    storage.set('isSetupComplete', newValue)
    this.emitUpdate()
  }

  constructor() {
    super()

    this.#init()
  }

  async #init(): Promise<void> {
    // @ts-ignore
    const isDefault = await storage.get('isDefaultWallet')
    // Initialize isDefaultWallet in storage if needed
    if (isDefault === undefined) {
      await storage.set('isDefaultWallet', true)
    } else {
      this.#_isDefaultWallet = isDefault

      if (!isDefault) {
        // injecting is registered first thing in the background
        // but if Ambire is not the default wallet the injection should be removed
        handleUnregisterEthereumInpageScript()
      }
    }

    this.#_onboardingState = await storage.get('onboardingState', undefined)

    this.#isPinned = await storage.get('isPinned', false)
    this.#initCheckIsPinned()

    this.#isSetupComplete = await storage.get('isSetupComplete', true)

    this.isReady = true
    this.emitUpdate()
  }

  async #reloadPageOnSwitchDefaultWallet() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
      if (!tab || !tab?.id) return
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          window.location.reload()
        }
      })
    } catch (error) {
      // Silent fail
    }
  }

  async #initCheckIsPinned() {
    if (this.isPinned && this.#isPinnedInterval) clearTimeout(this.#isPinnedInterval)
    if (this.isPinned) return
    // @ts-ignore
    const userSettings = await browser.action.getUserSettings()
    if (userSettings.isOnToolbar) this.isPinned = true

    if (!this.#isSetupComplete) {
      this.#isPinnedInterval = setTimeout(this.#initCheckIsPinned.bind(this), 500)
    }
  }

  toJSON() {
    return {
      ...this,
      ...super.toJSON(),
      isDefaultWallet: this.isDefaultWallet,
      onboardingState: this.onboardingState,
      isPinned: this.isPinned,
      isSetupComplete: this.isSetupComplete
    }
  }
}
