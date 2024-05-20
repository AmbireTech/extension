import { MainController } from '@ambire-common/controllers/main/main'
import colors from '@common/styles/colors'
import { browser } from '@web/constants/browserapi'

export class BadgesController {
  #mainCtrl: MainController

  #bannersCount: number = 0

  _badgesCount: number = 0

  get badgesCount() {
    return this._badgesCount + this.#bannersCount
  }

  set badgesCount(newValue: number) {
    this._badgesCount = newValue
    this.setBadges(this.badgesCount)
  }

  constructor(mainCtrl: MainController) {
    this.#mainCtrl = mainCtrl

    this.#mainCtrl.onUpdate(() => {
      this.badgesCount =
        this.#mainCtrl.actions.actionsQueue.filter((a) => a.type !== 'accountOp').length +
        mainCtrl.banners.length
    })
  }

  setBadges = (badgesCount: number) => {
    if (badgesCount <= 0) {
      ;(browser.browserAction || browser.action).setBadgeText({
        text: null
      })
    } else {
      ;(browser.browserAction || browser.action).setBadgeText({
        text: `${badgesCount}`
      })
      ;(browser.browserAction || browser.action).setBadgeBackgroundColor({
        color: colors.turquoise
      })
    }
  }

  toJSON() {
    return {
      ...this,
      badgesCount: this.badgesCount // includes the getter in the stringified instance
    }
  }
}
