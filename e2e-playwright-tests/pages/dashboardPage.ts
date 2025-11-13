import locators from 'constants/locators'
import selectors from 'constants/selectors'
import BootstrapContext from 'interfaces/bootstrapContext'
import Tabs from 'interfaces/tabs'

import { expect } from '@playwright/test'

import Token from '../interfaces/token'
import { BasePage } from './basePage'

export class DashboardPage extends BasePage {
  extensionURL: string

  constructor(opts: BootstrapContext) {
    super(opts)
    this.extensionURL = opts.extensionURL
  }

  async navigateToDashboard() {
    await this.navigateToURL(`${this.extensionURL}/tab.html#/`)
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

  async getCurrentBalance() {
    const amountText = await this.page.getByTestId(selectors.dashboardGasTankBalance).innerText()
    const amountNumber = parseFloat(amountText.replace(/[^\d.]/g, ''))

    return amountNumber
  }

  async checkBATokenBalance(token: Token) {
    const key = `${token.symbol}-${token.chainId}`
    const balanceThresholds: Record<string, number> = {
      'WALLET-8453': 400,
      'USDC-10': 2,
      'xWALLET-1': 2
    }

    const minBalance = balanceThresholds[key] ?? 0
    const tokenBalance = await this.getDashboardTokenBalance(token)

    let error: string | undefined

    try {
      expect(tokenBalance).toBeGreaterThanOrEqual(minBalance)
    } catch (e) {
      error = `${token.symbol}-${token.chainId} balance for BA is only: ${tokenBalance}.`
    }
    return { token, error }
  }

  async checkSATokenBalance(token: Token) {
    const key = `${token.symbol}-${token.chainId}`
    const balanceThresholds: Record<string, number> = {
      'WALLET-8453': 400,
      'USDC-8453': 3,
      'USDC-10': 2,
      'USDC.E-10': 2,
      'DAI-10': 2,
      'xWALLET-1': 2
    }

    const minBalance = balanceThresholds[key] ?? 0
    const tokenBalance = await this.getDashboardTokenBalance(token)

    let error: string | undefined

    try {
      expect(tokenBalance).toBeGreaterThanOrEqual(minBalance)
    } catch (e) {
      error = `${token.symbol}-${token.chainId} balance for SA is only: ${tokenBalance}.`
    }
    return { token, error }
  }

  async checkNoTransactionOnActivityTab() {
    await this.click(selectors.dashboard.activityTabButton)
    await this.compareText(
      selectors.dashboard.noTransactionOnActivityTab,
      "Ambire doesn't retrieve transactions made before installing the extension, but you can check your address on etherscan.io."
    )
  }

  // TODO: use this method to check activity tab after POM refactor
  async checkSendTransactionOnActivityTab() {
    await this.click(selectors.dashboard.activityTabButton)
    await expect(this.page.locator(selectors.dashboard.transactionSendText)).toContainText('Send')
    await expect(this.page.locator(selectors.dashboard.confirmedTransactionPill)).toContainText(
      'Confirmed'
    )
  }

  async search(searchInput: string, tabName: Tabs) {
    // click on magnifying glass icon
    await this.click(`${selectors.dashboard.magnifyingGlassIcon}-${tabName}`)

    // enter search phrase
    await this.entertext(selectors.searchInput, searchInput)
  }

  async searchByNetworkDropdown(searchInput: string, tabName: Tabs) {
    // open dropdown
    await this.click(`${selectors.dashboard.networksDropdown}-${tabName}`)

    // search network
    await this.entertext(selectors.dashboard.searchForNetwork, searchInput)

    // click on searched network
    const networkSelector = this.page.locator(`//div[text()="${searchInput}"]`)
    await networkSelector.click()
  }

  async checkOpenTicketPage() {
    // assert text
    await this.compareText(
      selectors.dashboard.suggestProtocolText,
      'To suggest a protocol integration, '
    )
    await this.compareText(selectors.dashboard.openTicketLink, 'open a ticket.')

    // check redirection
    const selector = this.page.getByTestId(selectors.dashboard.openTicketLink)
    const newTab = await this.handleNewPage(selector)

    expect(newTab.url()).toContain('help.ambire.com/hc/en-us')
  }

  async checkRewardsPageRedirection() {
    const infoButton = this.page.getByTestId(selectors.dashboard.projectedRewardsInfoButton)

    const newTab = await this.handleNewPage(infoButton)
    expect(newTab.url()).toContain('https://rewards.ambire.com/')
  }
}
