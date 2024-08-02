import { MainController } from '@ambire-common/controllers/main/main'
import colors from '@common/styles/colors'
import { browser } from '@web/constants/browserapi'
import { setExtensionIcon } from '@web/extension-services/background/webapi/icon'

export class BadgesController {
  #mainCtrl: MainController

  #bannersCount: number = 0

  #badgesCount: number = 0

  #icon: 'default' | 'locked' | null = null

  get badgesCount() {
    return this.#badgesCount + this.#bannersCount
  }

  set badgesCount(newValue: number) {
    this.#badgesCount = newValue
    this.setBadges(this.badgesCount)
  }

  constructor(mainCtrl: MainController) {
    this.#mainCtrl = mainCtrl

    this.#mainCtrl.onUpdate(() => {
      this.badgesCount = this.#mainCtrl.actions.visibleActionsQueue.filter(
        (a) => a.type !== 'benzin'
      ).length
    })

    this.#mainCtrl.keystore.onUpdate(() => {
      if (!mainCtrl.keystore.isUnlocked && (!this.#icon || this.#icon === 'default')) {
        this.#icon = 'locked'
        setExtensionIcon('locked')
      }

      if (mainCtrl.keystore.isUnlocked && (!this.#icon || this.#icon === 'locked')) {
        this.#icon = 'default'
        setExtensionIcon('default')
      }
    })
  }

  setBadges = (badgesCount: number) => {
    if (badgesCount <= 0) {
      browser.action.setBadgeText({ text: '' })
    } else {
      browser.action.setBadgeText({ text: `${badgesCount}` })
      browser.action.setBadgeBackgroundColor({ color: colors.turquoise })
    }
  }

  toJSON() {
    return {
      ...this,
      badgesCount: this.badgesCount // includes the getter in the stringified instance
    }
  }
}
