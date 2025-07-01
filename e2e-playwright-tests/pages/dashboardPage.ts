import locators from 'constants/locators'
import { expect } from '@playwright/test'

import { bootstrapWithStorage } from 'common-helpers/bootstrap'
import { BasePage } from './basePage'

export class DashboardPage extends BasePage {
  async init(param) {
    const { page } = await bootstrapWithStorage('dashboard', param)
    this.page = page
  }

  // TODO: should be refactored
  async checkBalanceInAccount(): Promise<void> {
    await this.page.waitForSelector(locators.fullAmountDashboard)
    expect(this.page.url()).toContain('/dashboard')
    const amountText = await this.page.locator(locators.fullAmountDashboard).innerText()
    const amountNumber = parseFloat(amountText.replace(/[^\d.]/g, ''))
    expect(amountNumber).toBeGreaterThan(0)
  }

  // TODO: should be refactored
  async checkIfTokensExist(): Promise<void> {
    const TOKEN_SYMBOLS = ['BTC', 'ETH', 'USDT']
    // await this.page.waitForFunction(() => window.location.href.includes('/dashboard'))
    await this.page.waitForSelector(locators.fullAmountDashboard)
    expect(this.page.url()).toContain('/dashboard')
    const innerTextOfTheWholePage = await this.page.innerText('body')
    const foundToken = TOKEN_SYMBOLS.find((token) => innerTextOfTheWholePage.includes(token))
    expect(foundToken).toBeTruthy()
  }

  // TODO: should be refactored
  async checkCollectibleItem(): Promise<void> {
    // await this.page.waitForFunction(() => window.location.href.includes('/dashboard'))
    await this.page.click(locators.tabNft)
    expect(this.page.url()).toContain('/dashboard')
    await this.page.waitForSelector(locators.collectionItem)
    const firstCollectiblesItem = await this.page.$$eval(
      locators.collectionItem,
      (elements) => elements[0]?.textContent ?? ''
    )
    await this.page.waitForSelector(locators.collectiblePicture)
    const collectiblePicture = await this.page.$(locators.collectiblePicture)
    if (collectiblePicture) {
      await collectiblePicture.click()
    } else {
      throw new Error('Collectible picture not found')
    }
    await this.page.waitForSelector(locators.collectibleRow)
    const modalText = await this.page.$eval(locators.collectibleRow, (el) => el.textContent)
    if (modalText) {
      expect(modalText).toContain(firstCollectiblesItem)
    } else {
      throw new Error('Modal text not found')
    }
  }
}
