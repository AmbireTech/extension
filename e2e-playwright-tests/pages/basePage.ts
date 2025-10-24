import selectors from 'constants/selectors'
import BootstrapContext from 'interfaces/bootstrapContext'
import Token from 'interfaces/token'

import { BrowserContext, expect, Locator, Page, Request as PWRequest } from '@playwright/test'

import { categorizeRequests } from '../utils/requests'

export class BasePage {
  page: Page

  context: BrowserContext

  private _reqListener?: (r: PWRequest) => void

  private _monitorInstalled = false

  collectedRequests: string[] = []

  constructor({ page, context }: BootstrapContext) {
    this.page = page
    this.context = context
  }

  async navigateToURL(url: string) {
    await this.page.goto(`${url}`)
  }

  async click(selector: string, index?: number): Promise<void> {
    await this.page
      .getByTestId(selector)
      .nth(index ?? 0)
      .click()
  }

  async clickOnMenuToken(token: Token, menuSelector: string = selectors.tokensSelect) {
    await this.click(menuSelector)

    // If the token is outside the viewport, we ensure it becomes visible by searching for its symbol
    await this.entertext(selectors.searchInput, token.symbol)

    // Ensure we click the token inside the BottomSheet,
    // not the one rendered as the default in the Select menu.
    const tokenLocator = this.page
      .getByTestId(selectors.bottomSheet)
      .getByTestId(`option-${token.address}.${token.chainId}`)
    await tokenLocator.click()
  }

  async clickOnMenuFeeToken(paidByAddress: string, token: Token, onGasTank?: boolean) {
    const selectMenu = this.page.getByTestId(selectors.feeTokensSelect)
    await selectMenu.click()

    // If the token is outside the viewport, we ensure it becomes visible by searching for its symbol
    await this.entertext(selectors.searchInput, token.symbol)

    const paidBy = paidByAddress
    const tokenAddress = token.address
    const tokenSymbol = token.symbol.toLowerCase()
    const gasTank = onGasTank ? 'gasTank' : ''

    // Ensure we click the token inside the SelectMenu,
    // not the one rendered as the default value.
    const tokenLocator = this.page
      .getByTestId('select-menu')
      .getByTestId(`option-${paidBy + tokenAddress + tokenSymbol + gasTank}`)
    await tokenLocator.click()
  }

  // TODO: refactor, this method can be depracated; switch to getByTestId
  async typeTextInInputField(locator: string, text: string): Promise<void> {
    await this.page.locator(locator).clear()
    await this.page.locator(locator).pressSequentially(text)
  }

  async clearFieldInput(selector: string): Promise<void> {
    await this.page.getByTestId(selector).fill('')
  }

  async getText(selector: string): Promise<string> {
    return this.page.getByTestId(selector).innerText()
  }

  async entertext(selector: string, text: string, index?: number): Promise<void> {
    await this.page
      .getByTestId(selector)
      .nth(index ?? 0)
      .fill(text)
  }

  async getValue(selector: string): Promise<string> {
    return this.page.getByTestId(selector).inputValue()
  }

  async handleNewPage(locator: Locator): Promise<Page> {
    const context = this.page.context()

    // const [actionWindowPagePromise] = await Promise.all([
    //   context.waitForEvent('page', { timeout: 10000 }),
    //   locator.first().click({ timeout: 5000 }) // trigger opening
    // ])

    // await actionWindowPagePromise.waitForLoadState('domcontentloaded')

    // return actionWindowPagePromise

    await locator.waitFor({ state: 'visible' })
    await expect(locator).toBeEnabled()

    const newPagePromise = context.waitForEvent('page', { timeout: 10000 })

    // initiate new page event
    await locator.click({ timeout: 5000 })

    // Wait for the newly opened page to be available
    const actionWindowPage = await newPagePromise

    // Wait until the new page is fully loaded (optional but recommended)
    await actionWindowPage.waitForLoadState('domcontentloaded')
    console.log('new page initiated')
    return actionWindowPage
  }

  async pause() {
    await this.page.pause()
  }

  // assertion methods
  async checkUrl(url: string) {
    await this.page.waitForURL(`**${url}`, { timeout: 3000 })
    expect(this.page.url()).toContain(url)
  }

  async expectButtonVisible(selector: string) {
    await expect(this.page.getByTestId(selector)).toBeVisible()
  }

  async expectButtonEnabled(selector: string) {
    await expect(this.page.getByTestId(selector)).toBeEnabled({ timeout: 5000 })
  }

  async compareText(selector: string, text: string, index?: number) {
    await expect(this.page.getByTestId(selector).nth(index ?? 0)).toContainText(text)
  }

  async isVisible(selector: string): Promise<boolean> {
    return this.page.getByTestId(selector).isVisible()
  }

  async expectElementNotVisible(selector: string): Promise<void> {
    await expect(this.page.getByTestId(selector)).not.toBeVisible()
  }

  async monitorRequests() {
    if (this._monitorInstalled) return
    this._reqListener = (request: PWRequest) => {
      const url = request.url()
      if (!url.startsWith('http')) return
      if (request.resourceType() !== 'fetch' || request.method() === 'OPTIONS') return

      this.collectedRequests.push(url)
    }
    this.context.on('request', this._reqListener)
    this._monitorInstalled = true
  }

  getCategorizedRequests() {
    return categorizeRequests(this.collectedRequests)
  }

  async getDashboardTokenBalance(token: Token) {
    const balanceText = await this.getText(`token-balance-${token.address}.${token.chainId}`)
    const tokenBalance = parseFloat(balanceText)

    return tokenBalance
  }
}
