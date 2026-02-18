import { MainController } from '@ambire-common/controllers/main/main'
import { CallsUserRequest } from '@ambire-common/interfaces/userRequest'
import ThemeColors from '@common/styles/themeConfig'
import { browser } from '@web/constants/browserapi'
import { setExtensionIcon } from '@web/extension-services/background/webapi/icon'

import { WalletStateController } from './wallet-state'

export class BadgesController {
  #mainCtrl: MainController

  #walletStateCtrl: WalletStateController

  #swapAndBridgeBannersCount: number = 0

  #badgesCount: number = 0

  #icon: 'default' | 'locked' | null = null

  get badgesCount() {
    return this.#badgesCount + this.swapAndBridgeBannersCount
  }

  set badgesCount(newValue: number) {
    this.#badgesCount = newValue
    this.setBadges(this.badgesCount)
  }

  get swapAndBridgeBannersCount() {
    return this.#swapAndBridgeBannersCount
  }

  set swapAndBridgeBannersCount(newValue: number) {
    this.#swapAndBridgeBannersCount = newValue
    this.setBadges(this.badgesCount)
  }

  constructor(mainCtrl: MainController, walletStateCtrl: WalletStateController) {
    this.#mainCtrl = mainCtrl
    this.#walletStateCtrl = walletStateCtrl

    this.#mainCtrl.onUpdate(() => {
      const swapAndBridgeBannersCount = this.#mainCtrl.swapAndBridge.banners.filter(
        (b) => b.category === 'bridge-ready'
      ).length

      this.swapAndBridgeBannersCount =
        (this.#mainCtrl.requests.currentUserRequest as CallsUserRequest | undefined)
          ?.signAccountOp && !!swapAndBridgeBannersCount
          ? swapAndBridgeBannersCount - 1
          : swapAndBridgeBannersCount
    })

    this.#mainCtrl.requests.onUpdate(() => {
      this.badgesCount = this.#mainCtrl.requests.visibleUserRequests.filter(
        (r) => r.kind !== 'benzin' && r.kind !== 'swapAndBridge' && r.kind !== 'transfer'
      ).length
    })

    this.#mainCtrl.keystore.onUpdate(() => {
      if (
        mainCtrl.keystore.hasPasswordSecret &&
        !mainCtrl.keystore.isUnlocked &&
        (!this.#icon || this.#icon === 'default')
      ) {
        this.#icon = 'locked'
        setExtensionIcon('locked')
      }

      if (mainCtrl.keystore.isUnlocked && (!this.#icon || this.#icon === 'locked')) {
        this.#icon = 'default'
        setExtensionIcon('default')
      }
    })

    this.#mainCtrl.swapAndBridge.onUpdate(() => {
      const swapAndBridgeBannersCount = this.#mainCtrl.swapAndBridge.banners.filter(
        (b) => b.category === 'bridge-ready'
      ).length

      this.swapAndBridgeBannersCount =
        (this.#mainCtrl.requests.currentUserRequest as CallsUserRequest | undefined)
          ?.signAccountOp && !!swapAndBridgeBannersCount
          ? swapAndBridgeBannersCount - 1
          : swapAndBridgeBannersCount
    })
  }

  setBadges = (badgesCount: number) => {
    try {
      if (badgesCount <= 0) {
        browser.action.setBadgeText({ text: '' })
      } else {
        browser.action.setBadgeText({ text: `${badgesCount}` })
        browser.action.setBadgeBackgroundColor({ color: ThemeColors.successDecorative.light })
      }
    } catch (error) {
      console.error(error)
    }
  }

  toJSON() {
    return {
      ...this,
      badgesCount: this.badgesCount,
      swapAndBridgeBannersCount: this.swapAndBridgeBannersCount
    }
  }
}
