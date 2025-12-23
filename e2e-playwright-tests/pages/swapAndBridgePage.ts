import { typeText } from 'common-helpers/typeText'
import locators from 'constants/locators'
import selectors, { SELECTORS } from 'constants/selectors'

import { expect } from '@playwright/test'

import Token from '../interfaces/token'
import { BasePage } from './basePage'

export class SwapAndBridgePage extends BasePage {
  // General function
  roundAmount(amount, place = 2) {
    // ToDo: Check if values should be int-ed or rounded. Values are currently int-ed
    const multipla = 10 ** place
    return Math.trunc(amount * multipla) / multipla
  }

  // General function
  async getElement(selector) {
    const element = await this.page.$(selector)
    expect(element).not.toBeNull()
    return element
  }

  // General function
  async verifyIfOnSwapAndBridgePage() {
    await expect(this.page.getByText('Swap & Bridge', { exact: true })).toBeVisible()
    expect(this.page.url()).toContain('/swap-and-bridge')
  }

  async getAmount(selector: string) {
    const amountText = await this.getValue(selector) // getting amount with suffix e.g. 1.01 DAI
    const amountNumber = parseFloat(amountText?.trim().split(' ')[0] ?? '0')
    return amountNumber
  }

  async enterNumber(new_amount, is_valid = true) {
    const message = 'Something went wrong! Please contact support'
    // Enter the amount
    await typeText(this.page, SELECTORS.fromAmountInputSab, new_amount.toString())
    // Assert if the message should be displayed
    if (is_valid) {
      await expect(this.page.locator(`span:has-text("${message}")`)).not.toBeVisible()
    } else {
      await expect(this.page.locator(`span:has-text("${message}")`)).toBeVisible()
    }
  }

  async switchTokensOnSwapAndBridge() {
    // Click the switch Tokens button
    await this.click(selectors.switchTokensTooltipSab)
    await this.page.waitForTimeout(1000) // waiting for switch

    // Ensure the tokens are switched
    // TODO: on FE these selectors return object not string like before
    // expect(this.getText(selectors.sendTokenSab)).toContain('WALLET') // after switch WALLET (Ambire Wallet)0x0Bb...2b80
    // expect(this.getText(selectors.receiveTokenSab)).toContain('USDC') // after switch USDC (USD Coin)0x833...2913
  }

  async openSwapAndBridge() {
    if (!this.page.url().includes('/swap-and-bridge')) {
      await this.click(selectors.dashboard.swapAndBridgeButton)
      await this.verifyIfOnSwapAndBridgePage()
    } else {
      await this.page.reload()
    }
  }

  // TODO: refactor this method
  async prepareSwapAndBridge(send_amount: number, fromToken: Token, toToken: Token) {
    await this.openSwapAndBridge()
    try {
      await this.selectSendToken(fromToken)
      // Select Receive Token on the same Network, which is automatically selected
      await this.selectReceiveToken(toToken)

      // If checking prepareSwapAndBridge functionality without providing send amount
      if (send_amount === null) {
        return null
      }

      // If a valid send amount is not provided
      if (send_amount <= 0) {
        throw new Error('send_amount" must be greater than 0')
      }

      // Enter the amount
      await this.page.getByTestId(selectors.fromAmountInputSab).fill(send_amount.toString())

      // TODO: Implement verifyRouteFound
      // await verifyRouteFound()
    } catch (error) {
      console.error(`[ERROR] Prepare Swap & Bridge Page Failed: ${error.message}`)
      throw error
    }
  }

  async selectSendToken(sendToken: Token) {
    await this.page.waitForTimeout(1000) // waiting for animation
    await this.clickOnMenuToken(sendToken, selectors.sendTokenSab)
  }

  async selectReceiveToken(receiveToken: Token) {
    await this.page.waitForTimeout(1000) // waiting for animation
    const loadingSelector = `[data-testid="${selectors.receiveTokenSab}"] >> text=Please select token`
    await this.page.locator(loadingSelector).waitFor({ state: 'visible' })

    await this.clickOnMenuToken(receiveToken, selectors.receiveTokenSab)
  }

  async verifyIfSwitchIsActive(reference = true) {
    await this.page.waitForTimeout(500)

    const switchElement = await this.page.$(SELECTORS.switchTokensTooltipSab)

    const isDisabled = await this.page.evaluate((element) => {
      const firstChild = element.children[0]
      return firstChild ? firstChild.getAttribute('aria-disabled') === 'true' : false
    }, switchElement)

    const isActive = !isDisabled
    expect(isActive).toBe(reference)
  }

  async verifySendMaxTokenAmount(fromToken: Token) {
    await this.openSwapAndBridge()
    await this.selectSendToken(fromToken)

    await this.click(selectors.maxAmountButton)
    const maxBalance = parseFloat(await this.getText(selectors.maxAvailableAmount))

    await this.page.waitForTimeout(500) // number has small delay before appearing

    const sendAmount = parseFloat(await this.getValue(selectors.fromAmountInputSab))
    const roundSendAmount = this.roundAmount(sendAmount, 2)

    // There is an intermittent difference in balances when running on CI; I have added an Alert to monitor it and using toBeCloseTo
    if (maxBalance !== roundSendAmount) {
      console.log(
        `⚠️ Token: ${fromToken} | maxBalance: ${maxBalance}, sendAmount: ${sendAmount} | roundSendAmount: ${roundSendAmount}`
      )
    }
    expect(maxBalance).toBeCloseTo(roundSendAmount, 1)
  }

  async verifyDefaultReceiveToken(sendToken: Token, receiveToken: Token): Promise<void> {
    await this.openSwapAndBridge()
    await this.selectSendToken(sendToken)

    await this.page.waitForTimeout(1000)

    const loadingSelector = `[data-testid="${selectors.receiveTokenSab}"] >> text=Please select token`
    await this.page.locator(loadingSelector).waitFor({ state: 'visible' })

    await this.click(selectors.receiveTokenSab)
    await this.page.getByTestId(selectors.searchInput).fill(receiveToken.symbol)

    const tokenLocator = this.page
      .getByTestId(selectors.bottomSheet)
      .getByTestId(`option-${receiveToken.address}.${receiveToken.chainId}`)
    await expect(tokenLocator).toBeVisible()
  }

  async verifyNonDefaultReceiveToken(sendToken: Token, receiveToken: Token) {
    await this.openSwapAndBridge()
    await this.selectSendToken(sendToken)

    await this.page.waitForTimeout(1000)

    const loadingSelector = `[data-testid="${selectors.receiveTokenSab}"] >> text=Please select token`
    await this.page.locator(loadingSelector).waitFor({ state: 'visible' })

    await this.click(selectors.receiveTokenSab)
    await this.page.getByTestId(selectors.searchInput).fill(receiveToken.symbol, { timeout: 3000 })
    await this.page.getByText('Not found. Try with token').isVisible()

    await this.page.locator(SELECTORS.searchInput).fill(receiveToken.address, { timeout: 3000 })

    const tokenLocator = this.page
      .getByTestId(selectors.bottomSheet)
      .getByTestId(`option-${receiveToken.address}.${receiveToken.chainId}`)

    await expect(tokenLocator).toBeVisible()
  }

  async rejectTransaction(): Promise<void> {
    // "Select route" step may take more time to appear, as it depends on the Li.Fi response.
    await this.page.waitForSelector(locators.selectRouteButton, {
      state: 'visible',
      timeout: 15000
    })
    await this.click(selectors.addToBatchButton)

    // approve high impact modal
    await this.handlePriceWarningModals()

    await this.click(selectors.goDashboardButton)
    await this.click(selectors.bannerButtonReject) // TODO: this ID gives 4 results on Dashboard page
    await expect(this.page.getByText('Transaction waiting to be').first()).not.toBeVisible()
  }

  async proceedTransaction(): Promise<void> {
    // "Select route" step may take more time to appear, as it depends on the Li.Fi response.
    await this.page.waitForSelector(locators.selectRouteButton, {
      state: 'visible',
      timeout: 12000
    })
    await this.click(selectors.addToBatchButton)

    // approve the high impact modal if appears
    await this.handlePriceWarningModals()

    await this.click(selectors.goDashboardButton)

    const openTransactionButton = this.page.getByTestId(selectors.bannerButtonOpen).first()

    const newPage = await this.handleNewPage(openTransactionButton)
    await this.signTransactionPage(newPage)
  }

  async signTransactionPage(page): Promise<void> {
    const signButton = page.getByTestId(selectors.signTransactionButton)

    try {
      // Select slow speed
      await page.getByTestId(selectors.transaction.feeSpeedSelectDropdown).click()
      await page.getByTestId(selectors.transaction.feeSpeedSlow).first().click()

      // check fee
      const feeSelector = await page.locator(selectors.transaction.feeGasTankInDollars).innerText() // returns e.g. '<$0.01'

      const feeDollarsAmount = Number(feeSelector.replace(/[<$]/g, ''))

      if (feeDollarsAmount > 0.1) {
        console.warn(
          `⚠️ Fee amount ($${feeDollarsAmount}) exceeds the $0.10 limit; transaction signing skipped.`
        )
      } else {
        await expect(signButton).toBeVisible({ timeout: 5000 })
        await expect(signButton).toBeEnabled({ timeout: 5000 })
        await page.getByTestId(selectors.signTransactionButton).click()
        await page.waitForTimeout(5000)

        // close transaction progress pop up
        await page.locator(selectors.closeTransactionProgressPopUpButton).click()
      }
    } catch (error) {
      console.warn("⚠️ The 'Sign' button is not clickable, but it should be.")
    }
  }

  async switchUSDValueOnSwapAndBridge(
    sendToken: Token,
    sendAmount?: number,
    delay = 1000
  ): Promise<void> {
    await this.page.waitForTimeout(delay)

    await this.openSwapAndBridge()
    await this.selectSendToken(sendToken)

    // wait before entering send amount
    await this.page.waitForTimeout(1000)

    await this.entertext(selectors.fromAmountInputSab, sendAmount.toString())
    const [usdOldAmount, currency] = await this.getUSDTextContent()
    expect(currency).toBe('$')
    const oldAmount = await this.getAmount(selectors.fromAmountInputSab)
    await this.page.waitForTimeout(500)
    await this.click(selectors.flipIcon)

    const [usdNewAmount, newCurrency] = await this.getUSDTextContent()
    const newAmount = this.roundAmount(await this.getAmount(selectors.fromAmountInputSab))
    expect(Math.abs(oldAmount - usdNewAmount)).toBeLessThanOrEqual(0.2)
    expect(Math.abs(usdOldAmount - newAmount)).toBeLessThanOrEqual(0.2)
    expect(newCurrency).toBe(sendToken.symbol)

    // Wait and flip back
    await this.page.waitForTimeout(500)
    await this.click(selectors.flipIcon)

    const [usdSecondAmount, secondCurrency] = await this.getUSDTextContent()
    // const secondAmount = await this.getSendAmount()
    const secondAmount = await this.getAmount(selectors.fromAmountInputSab)

    expect(Math.abs(newAmount - usdSecondAmount)).toBeLessThanOrEqual(0.2)
    expect(Math.abs(usdNewAmount - secondAmount)).toBeLessThanOrEqual(0.2)
    expect(secondCurrency).toBe('$')
  }

  async getUSDTextContent(): Promise<[number, string]> {
    const content = await this.page.getByTestId(selectors.switchCurrencySab).innerText()

    let currency: string | null = null
    let amount: string | null = null

    if (/\$/.test(content)) {
      const match = content.match(/^([^0-9\s]+)?([\d,.]+)/)
      currency = match?.[1] || ''
      amount = match?.[2] || ''
    } else {
      const match = content.match(/([\d,.]+)\s*([\w.]+)$/)
      amount = match?.[1] || ''
      currency = match?.[2] || ''
    }

    return [Number(amount.replace(/,/g, '')), currency]
  }

  async verifyAutoRefreshRoute(): Promise<void> {
    const routeSelector = this.page.getByTestId('select-route')
    await routeSelector.waitFor({ state: 'hidden', timeout: 65000 })
    const didReappear = await routeSelector
      .waitFor({ state: 'visible', timeout: 65000 })
      .then(() => true)
      .catch(() => false)
    expect(didReappear).toBe(true)
  }

  async assertSelectedAggregator(): Promise<void> {
    await expect(this.page.getByText('SushiSwap').last()).toBeVisible()
    await expect(this.page.getByTestId('selected-route')).toBeVisible()
  }

  async clickOnSecondRoute(): Promise<void> {
    await this.click(selectors.selectRouteButton)
    await this.page.locator(selectors.sushiSwapRoute).last().click() // missing ID
    await this.click(selectors.selectRouteButton)
    await this.assertSelectedAggregator()
  }

  async prepareBridgeTransaction(
    sendAmount: number,
    sendToken: Token,
    receiveToken: Token
  ): Promise<string | null> {
    try {
      await this.openSwapAndBridge()
      await this.page.waitForTimeout(1000)
      await this.selectSendToken(sendToken)

      // Select target receive network
      await this.click(`option-${sendToken.chainId}`)
      await this.click(`option-${receiveToken.chainId}`)

      // Select receive token by address
      await this.page.waitForTimeout(1000)
      await this.selectReceiveToken(receiveToken)

      // Validate sendAmount
      if (sendAmount === null) return null
      if (sendAmount <= 0) throw new Error('sendAmount must be greater than 0')

      await this.page.getByTestId(selectors.fromAmountInputSab).fill(sendAmount.toString())

      const isFollowUp = await this.page
        .waitForSelector(selectors.confirmFollowUpTxn, { timeout: 6000 })
        .catch(() => null)
      if (isFollowUp) {
        await this.click(selectors.confirmFollowUpTxn)
      }

      return 'Proceed'
    } catch (error) {
      console.error(`[ERROR] Prepare Bridge Transaction Failed: ${error.message}`)
      throw error
    }
  }

  async batchAction(): Promise<void> {
    await this.page.getByTestId(selectors.addToBatchButton).isEnabled()
    await this.click(selectors.addToBatchButton)

    // approve high impact modal
    await this.handlePriceWarningModals()

    await this.page.getByTestId(selectors.addMoreButton).isVisible()
    await this.click(selectors.addMoreButton)
  }

  async batchActionWithSign(): Promise<void> {
    await this.page.getByTestId(selectors.addToBatchButton).isEnabled()
    await this.click(selectors.addToBatchButton)

    // approve high impact modal
    await this.handlePriceWarningModals()

    await this.click(selectors.goDashboardButton)

    const openTransactionButton = this.page.getByTestId(selectors.bannerButtonOpen).first()

    const newPage = await this.handleNewPage(openTransactionButton)
    await this.signBatchTransactionsPage(newPage)
  }

  async signBatchTransactionsPage(page): Promise<void> {
    const signButton = page.getByTestId(selectors.signTransactionButton)

    // Select slow speed
    await page.getByTestId(selectors.transaction.feeSpeedSelectDropdown).click()
    await page.getByTestId(selectors.transaction.feeSpeedSlow).first().click()

    // check fee
    const feeSelector = await page.locator(selectors.transaction.feeGasTankInDollars).innerText() // returns e.g. '<$0.01'

    const feeDollarsAmount = Number(feeSelector.replace(/[<$]/g, ''))

    if (feeDollarsAmount > 0.1) {
      console.warn(
        `⚠️ Fee amount ($${feeDollarsAmount}) exceeds the $0.10 limit; transaction signing skipped.`
      )
    } else {
      await expect(signButton).toBeVisible({ timeout: 5000 })
      await expect(signButton).toBeEnabled({ timeout: 5000 })
      await this.verifyBatchTransactionDetails(page)
      await page.waitForTimeout(3000)
    }
  }

  async verifyBatchTransactionDetails(page): Promise<void> {
    // check first row
    const firstRow = await page.getByTestId('recipient-address-0').innerText() // grab entire row on transaction page
    const firstRouteSelector = firstRow.trim().split(/\s+/).pop() || '' // grab last item from row e.g. LI.FI

    // for either LI.FI or Socket transaction name is GrantApproval with amount and token name
    await expect(page.getByTestId('recipient-address-0')).toHaveText(
      /Grant approval.*0\.0\d+.*USDC/
    )
    expect(['LI.FI', 'SocketGateway']).toContain(firstRouteSelector)

    // check second row
    const secondRow = await page.getByTestId('recipient-address-1').innerText()
    const secondRouteSelector = secondRow.trim().split(/\s+/).pop() || ''

    if (secondRouteSelector === 'WALLET') {
      // in case its socket route transaction name is Swap with amount
      await expect(page.getByTestId('recipient-address-1')).toHaveText(/Swap.*0\.0\d+.*USDC/) // in case its socket route transaction name is Swap with amount
    } else if (secondRouteSelector === 'LI.FI') {
      await expect(page.getByTestId('recipient-address-1')).toHaveText(/Swap\/Bridge/) // in case its LIFI route transaction name is Swap/Bridge
    }
    expect(['LI.FI', 'SocketGateway']).toContain(secondRouteSelector)

    // check third row
    const thirdRow = await page.getByTestId('recipient-address-2').innerText()
    const thirdRouteSelector = thirdRow.trim().split(/\s+/).pop() || ''

    // for either LI.FI or Socket transaction name is GrantApproval with amount and token name
    await expect(page.getByTestId('recipient-address-2')).toHaveText(
      /Grant approval.*0\.0\d+.*USDC/
    )
    expect(['LI.FI', 'SocketGateway']).toContain(thirdRouteSelector)

    // check fourth row
    const fourthRow = await page.getByTestId('recipient-address-3').innerText()
    const fourthRouteSelector = fourthRow.trim().split(/\s+/).pop() || ''

    if (secondRouteSelector === 'WALLET') {
      // in case of Socket route transaction name is Swap with amount and token name
      await expect(page.getByTestId('recipient-address-3')).toHaveText(/Swap.*0\.0\d+.*USDC/)
    } else if (secondRouteSelector === 'LI.FI') {
      await expect(page.getByTestId('recipient-address-3')).toHaveText(/Swap\/Bridge/) // in case of LIFI route transaction name is Swap/Bridge
    }
    expect(['LI.FI', 'SocketGateway']).toContain(fourthRouteSelector)

    // sign transaction
    await page.getByTestId(selectors.signTransactionButton).click()
  }

  async getCurrentBalance() {
    const amountText = await this.page.getByTestId(selectors.dashboardGasTankBalance).innerText()
    const amountNumber = parseFloat(amountText.replace(/[^\d.]/g, ''))

    return amountNumber
  }

  // TODO: use this method to check activity tab after POM refactor
  async checkSendTransactionOnActivityTab() {
    await this.click(selectors.dashboard.activityTabButton)

    // When tests are ran in isolation, there would be only 1 txn in the activity tab.
    // But when they are ran in a shared state, we check only the latest one txn, i.e. the first one in the list.
    const firstApprovalTransaction = this.page
      .locator(selectors.dashboard.grantApprovalText)
      .first()
    const firstConfirmedPill = this.page
      .locator(selectors.dashboard.confirmedTransactionPill)
      .first()

    await expect(firstApprovalTransaction).toContainText('Grant approval')
    await expect(firstConfirmedPill).toContainText('Confirmed')
  }
}
