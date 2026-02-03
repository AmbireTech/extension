import locators from 'constants/locators'
import selectors from 'constants/selectors'
import BootstrapContext from 'interfaces/bootstrapContext'
import Tabs from 'interfaces/tabs'
import Threshold, { ThresholdError } from 'interfaces/threshold'

import { expect } from '@playwright/test'

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

  async #checkBalanceThresholds(params: { thresholds: Threshold[] }): Promise<{
    errors: ThresholdError[]
    warnings: ThresholdError[]
  }> {
    const { thresholds } = params

    const errors: ThresholdError[] = []
    const warnings: ThresholdError[] = []

    // eslint-disable-next-line no-restricted-syntax
    for (const [token, minBalance] of thresholds) {
      let balance: number
      let tokenName: string
      let chainName: string

      if (token === 'gas-token') {
        // eslint-disable-next-line no-await-in-loop
        balance = await this.getCurrentBalance()
        tokenName = 'gas-token'
        chainName = 'N/A'
      } else {
        // eslint-disable-next-line no-await-in-loop
        balance = await this.getDashboardTokenBalance(token)
        tokenName = token.symbol
        chainName = token.chainName
      }

      const warnThreshold = minBalance * 1.5

      if (balance < minBalance) {
        errors.push({ tokenName, chainName, balance, minBalance })
      } else if (balance < warnThreshold) {
        warnings.push({ tokenName, chainName, balance, minBalance })
      }
    }

    return { errors, warnings }
  }

  async checkBalances(params: { thresholds: Threshold[]; accountName: string }): Promise<void> {
    const { thresholds, accountName } = params

    const { errors, warnings } = await this.#checkBalanceThresholds({
      thresholds
    })

    const formatTokens = (
      items: { tokenName: string; chainName: string; balance: number; minBalance: number }[]
    ) =>
      items
        .map(
          (i) =>
            `${i.tokenName} on ${i.chainName} (current: ${i.balance}, minimumRequired: ${i.minBalance})`
        )
        .join(', ')

    let errorMessage: string | undefined
    let warningMessage: string | undefined

    if (warnings.length > 0) {
      const warningTokens = formatTokens(warnings)
      warningMessage = `💰 ${accountName} balance is getting low for: ${warningTokens}.`
    }

    if (errors.length > 0) {
      const errorTokens = formatTokens(errors)
      errorMessage = `${accountName} has insufficient balance for: ${errorTokens}.`
    }

    if (warningMessage) {
      console.log(warningMessage)
    }

    if (errorMessage) {
      throw new Error(errorMessage)
    }

    console.log(`✅ ${accountName} tokens and gas tank have sufficient balance.`)
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

  async checkRewardsPageRedirection(selector: string) {
    const rewardsButton = this.page.getByTestId(selector)
    await rewardsButton.click()

    const rewardsLink = this.page.locator(selectors.dashboard.rewardsLink)

    const newTab = await this.handleNewPage(rewardsLink)
    expect(newTab.url()).toContain('https://rewards.ambire.com/')

    await newTab.close()

    // return to dashboard
    await this.page.locator(selectors.dashboard.backRewardsButton).click()
  }
}
