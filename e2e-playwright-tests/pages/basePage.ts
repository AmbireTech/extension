import selectors from 'constants/selectors'
import Token from 'interfaces/token'

import { expect, Locator, Page } from '@playwright/test'

export abstract class BasePage {
  page: Page

  abstract init(param?): Promise<void> // ⛔ Must be implemented in subclasses

  async navigateToHome() {
    await this.page.goto('/')
  }

  async click(selector: string, index?: number): Promise<void> {
    await this.page.getByTestId(selector).nth(index ?? 0).click()
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

    const paidBy = paidByAddress.toLowerCase()
    const tokenAddress = token.address.toLowerCase()
    const tokenSymbol = token.symbol.toLowerCase()
    const gasTank = onGasTank ? 'gastank' : ''

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

  async getText(selector: string): Promise<string> {
    return await this.page.getByTestId(selector).innerText()
  }

  async entertext(selector: string, text: string): Promise<void> {
    await this.page.getByTestId(selector).fill(text)
  }

  async getValue(selector: string): Promise<string> {
    return await this.page.getByTestId(selector).inputValue()
  }

  async handleNewPage(locator: Locator) {
    const context = this.page.context();

    const [actionWindowPagePromise] = await Promise.all([
      context.waitForEvent('page'),
      locator.first().click({ timeout: 5000 })  // trigger opening
    ]);

    return actionWindowPagePromise;
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

  async compareText(selector: string, text: string) {
    await expect(this.page.getByTestId(selector)).toContainText(text)
  }
}
