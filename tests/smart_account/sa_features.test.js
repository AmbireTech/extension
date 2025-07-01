import { clickOnElement } from '../common-helpers/clickOnElement'
import { typeText } from '../common-helpers/typeText'
import { bootstrapWithStorage } from '../common-helpers/bootstrapWithStorage'
import { baParams, saParams } from '../config/constants'
import { triggerTransaction } from '../common-helpers/triggerTransaction'
import { signTransaction } from '../common-helpers/signTransaction'
import { confirmTransactionStatus } from '../common-helpers/confirmTransactionStatus'
import { selectFeeToken } from '../common-helpers/selectFeeToken'
import { checkBalanceOfToken } from '../common-helpers/checkBalanceOfToken'
import { SELECTORS } from '../common/selectors/selectors'
import { SMART_ACC_VIEW_ONLY_ADDRESS } from '../constants/constants'

let browser
let page
let extensionURL
let recorder

describe('sa_features', () => {
  beforeEach(async () => {
    const context = await bootstrapWithStorage('sa_features', saParams)
    browser = context.browser
    page = context.page
    recorder = context.recorder
    extensionURL = context.extensionURL
  })

  afterEach(async () => {
    await recorder.stop()
    await browser.close()
  })

  //--------------------------------------------------------------------------------------------------------------
  it.skip('4337 transaction. Send 0.00000001 ETH on Optimism.Pay with ETH', async () => {
    // Check if ETH in optimism are under 0.00000001
    await checkBalanceOfToken(
      page,
      '[data-testid="token-0x0000000000000000000000000000000000000000-10"]',
      0.00000001
    )

    // Click on ETH (not Gas Tank token)
    await clickOnElement(
      page,
      '[data-testid="token-0x0000000000000000000000000000000000000000-10"]'
    )

    const buttonSelector = '[data-testid="top-up-button"]'
    // Wait for the button to appear in the DOM
    await page.waitForSelector(buttonSelector)

    // Wait for the button to be visible and enabled
    await page.waitForFunction(
      (selector) => {
        const button = document.querySelector(selector)
        return button && button.offsetParent !== null && !button.disabled
      },
      {},
      buttonSelector
    )

    // Click on "Send"
    await clickOnElement(page, '[data-testid="token-send"]', true, 500)

    await page.waitForFunction(
      () => {
        return window.location.href.includes('/transfer')
      },
      { timeout: 60000 }
    )

    await page.waitForSelector('[data-testid="amount-field"]')
    await typeText(page, '[data-testid="amount-field"]', '0.00000001')

    // Type the address of the recipient
    await typeText(page, SELECTORS.addressEnsField, SMART_ACC_VIEW_ONLY_ADDRESS)
    await page.waitForXPath(
      '//div[contains(text(), "This address isn\'t in your Address Book. Double-check the details before confirming.")]'
    )
    await page.waitForSelector('[data-testid="recipient-address-unknown-checkbox"]')

    // Check the checkbox "Confirm sending to this address."
    await page.waitForSelector('[data-testid="recipient-address-unknown-checkbox"]')
    await clickOnElement(page, '[data-testid="recipient-address-unknown-checkbox"]')

    // Check the checkbox "I confirm this address is not a Binance wallets...."
    const checkboxExists = await page.evaluate(
      (selector) => !!document.querySelector(selector),
      SELECTORS.checkbox
    )
    if (checkboxExists) await clickOnElement(page, SELECTORS.checkbox)

    // Click on "Send" button and cofirm transaction
    const { actionWindowPage: newPage, transactionRecorder } = await triggerTransaction(
      page,
      extensionURL,
      browser,
      '[data-testid="proceed-btn"]'
    )

    const baFeeTokenSelector = `[data-testid="option-${baParams.envSelectedAccount.toLowerCase()}0x0000000000000000000000000000000000000000eth"]`
    // Check if select fee token is visible and select the token
    await selectFeeToken(newPage, baFeeTokenSelector)
    // Sign and confirm the transaction
    await signTransaction(newPage, transactionRecorder)
    await confirmTransactionStatus(newPage, 'optimism', 10, transactionRecorder)
  })

  //--------------------------------------------------------------------------------------------------------------
  it.skip('Check token balance needed for e2e tests', async () => {
    // Check if ETH in optimism are under 0.0000001
    await checkBalanceOfToken(
      page,
      '[data-testid="token-0x0000000000000000000000000000000000000000-10"]',
      0.0000001
    )
    // Check if ETH on Base are under 0.02
    await checkBalanceOfToken(page, SELECTORS.nativeTokenBaseDashboard, 0.02)
    // Check if USDC on Gas Tank are under 0.01
    await checkBalanceOfToken(
      page,
      '[data-testid="token-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48-1-gastank"]',
      0.01
    )
  })
})
