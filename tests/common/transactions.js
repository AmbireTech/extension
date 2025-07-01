import { PuppeteerScreenRecorder } from 'puppeteer-screen-recorder'

import { getRecordingName } from '../common-helpers/utils'
import { clickOnElement } from '../common-helpers/clickOnElement'
import { typeText } from '../common-helpers/typeText'
import { selectUSDCTokenOnBase } from '../common-helpers/selectUSDCTokenOnBase'
import { triggerTransaction } from '../common-helpers/triggerTransaction'
import { checkForSignMessageWindow } from '../common-helpers/checkForSignMessageWindow'
import { selectFeeToken } from '../common-helpers/selectFeeToken'
import { signTransaction } from '../common-helpers/signTransaction'
import { confirmTransactionStatus } from '../common-helpers/confirmTransactionStatus'
import { checkBalanceOfToken } from '../common-helpers/checkBalanceOfToken'
import { SELECTORS, TEST_IDS } from './selectors/selectors'
import { buildSelector } from '../common-helpers/buildSelector'
import { SMART_ACC_VIEW_ONLY_ADDRESS } from '../constants/constants'

// When we run tests in GitHub Actions in parallel (with different PRs running tests simultaneously),
// it's very likely that the nonce we use for the transaction may already have been used.
// Since we can't run the tests sequentially, we've introduced this workaround to handle this scenario,
// which will reload the sign-acc-op page if a `nonce too low` error is detected.
// Upon reloading, our @ambire-app logic will retrieve the next available nonce.
// Please note, this fix is only for E2E tests, as in a real-world scenario,
// it's uncommon for a user to operate with the same account from multiple extension instances at the same time.
const overcomeNonceError = async (page) => {
  let hasNonceError = false
  try {
    const nonceError = await page.waitForXPath(
      '//*[contains(text(), "Perhaps wrong nonce set in Account op") or contains(text(), "replacement transaction underpriced")]',
      { timeout: 3000 }
    )

    hasNonceError = nonceError !== null
  } catch {
    hasNonceError = false
  }

  if (hasNonceError) {
    await page.reload()
    await overcomeNonceError(page)
  }
}

// TODO: Fix this
const recipientField = SELECTORS.addressEnsField
const amountField = SELECTORS.amountField
const usdcTokenSelector = SELECTORS.nativeTokenBaseDashboard
const TARGET_HEIGHT = 58.7
const MAX_TIME_WAIT = 30000
//--------------------------------------------------------------------------------------------------------------

async function isAriaDisabled(page, selector) {
  await page.waitForSelector(selector)
  const ariaDisabledValue = await page.$eval(selector, (el) => el.getAttribute('aria-disabled'))

  return ariaDisabledValue === 'true'
}

export async function prepareTransaction(
  page,
  recipient,
  amount,
  { shouldUseAddressBookRecipient = false, shouldSendButtonBeDisabled = false } = {}
) {
  await page.waitForSelector(amountField)
  await typeText(page, amountField, amount)

  if (!shouldUseAddressBookRecipient) {
    await typeText(page, SELECTORS.addressEnsField, recipient)
    await page.waitForXPath(
      '//div[contains(text(), "This address isn\'t in your Address Book. Double-check the details before confirming.")]'
    )

    // Check the checkbox "Confirm sending to this address."
    await clickOnElement(page, SELECTORS.recipientAddressUnknownCheckbox)

    // Check the checkbox "I confirm this address is not a Binance wallets...."
    const checkboxExists = await page.evaluate(
      (selector) => !!document.querySelector(selector),
      SELECTORS.checkbox
    )
    if (checkboxExists) await clickOnElement(page, SELECTORS.checkbox)
  } else {
    await clickOnElement(page, SELECTORS.addressEnsField)
    await clickOnElement(page, buildSelector(TEST_IDS.addressBookMyWalletContactDyn, 1))
  }

  if (shouldSendButtonBeDisabled) {
    const isDisabled = await isAriaDisabled(page, SELECTORS.proceedBtn)

    expect(isDisabled).toBe(true)
  }
}

export function checkIsFeeSpeedSelected(page, feeSpeedSelector) {
  return page.evaluate((selector) => {
    const element = document.querySelector(selector)
    return !!element
  }, feeSpeedSelector)
}

async function prepareGasTankTopUp(page, recipient, amount) {
  await page.waitForSelector(amountField)
  await typeText(page, amountField, amount)
}

async function processTnxSpeedSteps(page, selectors, delayTimeInMs) {
  // eslint-disable-next-line no-restricted-syntax
  for (const selector of selectors) {
    // eslint-disable-next-line no-await-in-loop
    await clickOnElement(page, '[data-testid="fee-speed-select"]', true, delayTimeInMs)
    // eslint-disable-next-line no-await-in-loop
    await clickOnElement(page, selector, true, delayTimeInMs)
    // eslint-disable-next-line no-await-in-loop
    await checkIsFeeSpeedSelected(page, selector)
  }
}

async function handleTransaction(
  page,
  extensionURL,
  browser,
  feeToken,
  shouldStopBeforeSign,
  shouldQueueAndSignLater,
  shouldRemoveTxnFromQueue,
  shouldChangeTxnSpeed,
  shouldRejectTxn
) {
  const { actionWindowPage: newPage, transactionRecorder } = await triggerTransaction(
    page,
    extensionURL,
    browser,
    SELECTORS.proceedBtn
  )

  if (shouldQueueAndSignLater) {
    await clickOnElement(newPage, SELECTORS.queueAndSignLaterButton)
    return
  }

  if (shouldRemoveTxnFromQueue) {
    await clickOnElement(newPage, buildSelector(TEST_IDS.deleteTxnCallDyn, 0))
  }

  if (shouldStopBeforeSign) return

  await overcomeNonceError(newPage)

  // Check if select fee token is visible and select the token
  if (feeToken) {
    await selectFeeToken(newPage, feeToken)
  }

  const delayTimeInMs = 500

  if (shouldChangeTxnSpeed) {
    const feeSelectorsSequence = [
      SELECTORS.feeSlow,
      SELECTORS.feeMedium,
      SELECTORS.feeFast,
      SELECTORS.feeApe,
      SELECTORS.feeFast
    ]
    await processTnxSpeedSteps(newPage, feeSelectorsSequence, delayTimeInMs)
  }

  if (shouldRejectTxn) {
    await clickOnElement(newPage, SELECTORS.transactionButtonReject, true, 500)
    return
  }

  // Sign and confirm the transaction
  await signTransaction(newPage, transactionRecorder)
  await confirmTransactionStatus(newPage, 'polygon', 137, transactionRecorder)
}

export async function checkTokenBalanceClickOnGivenActionInDashboard(
  page,
  selectedToken,
  selectedAction,
  minBalance = 0.00001
) {
  await page.waitForFunction(() => window.location.href.includes('/dashboard'))

  // Check ths balance of the selected token if it's lower than 'minBalance' and throws an error if it is
  await checkBalanceOfToken(page, selectedToken, minBalance)
  // Click on the token, which opens the modal with actions
  await clickOnElement(page, selectedToken)
  // Click on given action
  await clickOnElement(page, selectedAction, true, 500)
}

export async function makeValidTransaction(
  page,
  extensionURL,
  browser,
  {
    feeToken,
    recipient = SMART_ACC_VIEW_ONLY_ADDRESS,
    tokenAmount = '0.000001',
    shouldStopBeforeSign = false,
    shouldUseAddressBookRecipient = false,
    shouldTopUpGasTank = false,
    shouldQueueAndSignLater = false,
    shouldRemoveTxnFromQueue = false,
    shouldChangeTxnSpeed = false,
    shouldRejectTxn = false
  } = {}
) {
  if (shouldTopUpGasTank) {
    await page.waitForFunction(() => window.location.href.includes('/top-up-gas-tank'))
  } else {
    await page.waitForFunction(() => window.location.href.includes('/transfer'))
  }

  if (shouldTopUpGasTank) {
    await prepareGasTankTopUp(page, recipient, tokenAmount)
  } else {
    await prepareTransaction(page, recipient, tokenAmount, {
      shouldUseAddressBookRecipient
    })
  }

  await handleTransaction(
    page,
    extensionURL,
    browser,
    feeToken,
    shouldStopBeforeSign,
    shouldQueueAndSignLater,
    shouldRemoveTxnFromQueue,
    shouldChangeTxnSpeed,
    shouldRejectTxn
  )
}

async function selectTokenInUni(page, tokenId, search) {
  if (search) {
    await typeText(page, '[data-testid="explore-search-input"]', search)
  }
  await clickOnElement(page, `[data-testid="${tokenId}"]`)

  // Wait until the menu is closed
  await page.waitForSelector(`[data-testid="${tokenId}"]`, {
    hidden: true
  })
}

async function prepareSwapLegacy(page) {
  // Change the network to Polygon
  await clickOnElement(page, '[data-testid="chain-selector-logo"]')
  await clickOnElement(page, '[data-testid="Polygon-selector"]')

  // If this web3 status indicator is not disabled, it means that the connection was successful.
  await page.waitForSelector('[data-testid="web3-status-connected"]:not([disabled])')

  // Select USDT and USDC tokens for swap
  await clickOnElement(page, 'xpath///span[contains(text(), "POL")]')

  await selectTokenInUni(page, 'common-8453-USDT')

  // Click on 'Select token' and select 'USDC' token
  await clickOnElement(page, 'xpath///span[contains(text(), "Select token")]')

  await selectTokenInUni(page, 'common-8453-USDC')
}

async function prepareSwap(page) {
  await clickOnElement(page, 'xpath///span[contains(text(), "Select token")]')

  await selectTokenInUni(page, 'token-option-137-USDC', 'USDC')

  try {
    await page.waitForXPath('//*[contains(text(), "Swapping on Polygon")]', {
      timeout: 30000 // 30 seconds
    })
  } catch {
    throw new Error(
      "Uniswap couldn't switch the network to Polygon! This may have been caused by an RPC outage. Please re-run the test and check the RPC."
    )
  }

  await clickOnElement(page, 'xpath///span[contains(text(), "Select token")]')

  await selectTokenInUni(page, 'token-option-137-USDT', 'USDT')
}

// Utility function to check if element's parent height matches the target
const isParentHeightEqual = async (elHandle, targetHeight) => {
  const heightOfParent = await elHandle.evaluate(
    (el) => el.parentElement.getBoundingClientRect().height
  )
  return parseFloat(heightOfParent.toFixed(1)) === targetHeight
}

// Utility function to check if element's parent is disabled based on aria-disabled attribute
const isParentDisabled = async (elHandle) => {
  return elHandle.evaluate((el) => el.parentElement.getAttribute('aria-disabled') === 'true')
}

// Utility function to wait for the parent element to become enabled
const waitForParentEnabled = async (page, elHandle, timeout = 500, maxWaitTime = MAX_TIME_WAIT) => {
  let isDisabled = true
  const startTime = Date.now()

  // Use a loop to repeatedly check if the element is enabled
  /* eslint-disable no-await-in-loop */
  while (isDisabled) {
    isDisabled = await isParentDisabled(elHandle)

    if (isDisabled) {
      const elapsedTime = Date.now() - startTime

      // Break the loop if maxWaitTime exceeded
      if (elapsedTime >= maxWaitTime) {
        console.log('Timeout exceeded for enabling the button, breaking the loop')
        break
      }

      await page.waitForTimeout(timeout) // Wait for a defined timeout before rechecking
    }
  }

  return !isDisabled
}

// Main function to handle clicking on elements that meet conditions
const clickMatchingElements = async (page, elementsHandles, targetHeight = TARGET_HEIGHT) => {
  await Promise.all(
    elementsHandles.map(async (elHandle) => {
      try {
        // Check if the parent's height matches the target height
        const heightMatches = await isParentHeightEqual(elHandle, targetHeight)

        if (heightMatches) {
          // Wait until the parent is enabled (aria-disabled = false)
          const isEnabled = await waitForParentEnabled(page, elHandle)

          if (isEnabled) {
            // Click the parent element once enabled
            await elHandle.evaluate((el) => el.parentElement.click())
          } else {
            console.log(`Element did not become enabled within a ${MAX_TIME_WAIT / 1000} seconds`)
          }
        }
      } catch (err) {
        console.error('Error while processing element:', err)
      }
    })
  )
}

//--------------------------------------------------------------------------------------------------------------
export async function makeSwap(
  page,
  extensionURL,
  browser,
  { feeToken, shouldStopBeforeSign = false, swapButtonText = 'Swap' } = {}
) {
  await page.goto('https://app.uniswap.org/swap', { waitUntil: 'load' })

  try {
    // Handle a modal that appears occasionally
    await page.waitForSelector('xpath///span[contains(text(), "Introducing Unichain")]', {
      timeout: 3000
    })

    const dismissButton = await page.waitForSelector('xpath///span[contains(text(), "Dismiss")]')
    await dismissButton.click()
  } catch {
    // Modal might be missing! Continue with the flow.
  }

  // Click somewhere just to hide the modal
  await clickOnElement(page, '[data-testid="navbar-connect-wallet"]')

  // Wait until modal disapears
  await page.waitForSelector(
    'xpath///div[contains(text(), "Introducing the Uniswap Extension.")]',
    {
      hidden: true
    }
  )

  // Click on 'connect' button
  await clickOnElement(page, '[data-testid="navbar-connect-wallet"]')

  // Select option: 'Injected Wallet'
  await clickOnElement(page, '[data-testid="wallet-option-injected"]')

  // Wait for the new page to be created and click on 'Connect' button
  const newTarget = await browser.waitForTarget(
    (target) => target.url() === `${extensionURL}/action-window.html#/dapp-connect-request`
  )
  const actionWindowPage = await newTarget.page()

  const actionWindowDapReqRecorder = new PuppeteerScreenRecorder(actionWindowPage, {
    followNewTab: true
  })
  await actionWindowDapReqRecorder.start(getRecordingName('action_window_dap_req'))
  actionWindowPage.setDefaultTimeout(120000)
  await actionWindowPage.setViewport({ width: 1000, height: 1000 })
  await clickOnElement(actionWindowPage, '[data-testid="dapp-connect-button"]')

  await actionWindowDapReqRecorder.stop()

  // Uniswap occasionally displays its old non chain-agnostic UI.
  // To ensure compatibility, we need to handle both the new and old versions.
  let shouldRunLegacyFlow = true

  try {
    await page.waitForSelector('[data-testid="chain-selector-logo"]', {
      visible: true,
      timeout: 3000
    })
  } catch {
    shouldRunLegacyFlow = false
  }

  if (shouldRunLegacyFlow) {
    await prepareSwapLegacy(page)
  } else {
    await prepareSwap(page)
  }

  await typeText(page, '[data-testid="amount-input-out"]', '0.0001')

  // TODO: Temporary solution with a delay (the DOM element is not a btn anymore)
  await clickOnElement(page, 'xpath///span[contains(text(), "Review")]', true, 3000)

  await page.waitForSelector(
    `xpath///span[contains(@class, "font_button") and contains(text(), "${swapButtonText}")]`,
    {
      visible: true,
      timeout: 3000
    }
  )

  const elementsHandles = await page.$x(
    `//span[contains(@class, "font_button") and contains(text(), "${swapButtonText}")]`
  )

  if (elementsHandles.length) await clickMatchingElements(page, elementsHandles)
  else throw new Error('No elements found')

  const { actionWindowPage: newPage, transactionRecorder } = await triggerTransaction(
    page,
    extensionURL,
    browser,
    '',
    false
  )

  // Check for sign message window
  const result = await checkForSignMessageWindow(newPage, extensionURL, browser)
  const updatedPage = result.actionWindowPage

  await overcomeNonceError(updatedPage)

  // Check if select fee token is visible and select the token
  if (feeToken) {
    await selectFeeToken(updatedPage, feeToken)
  }

  if (shouldStopBeforeSign) return

  // Sign and confirm the transaction
  await signTransaction(updatedPage, transactionRecorder)
  await confirmTransactionStatus(updatedPage, 'polygon', 137, transactionRecorder)
}

//--------------------------------------------------------------------------------------------------------------
export async function sendFundsGreaterThanBalance(page, extensionURL) {
  await page.goto(`${extensionURL}/tab.html#/transfer`, { waitUntil: 'load' })

  await page.waitForSelector('[data-testid="max-available-amount"]')

  await selectUSDCTokenOnBase(page)

  // Wait for the max amount to load
  await new Promise((resolve) => {
    setTimeout(resolve, 1000)
  })
  // Get the available balance
  const maxAvailableAmount = await page.evaluate(() => {
    const balance = document.querySelector('[data-testid="max-available-amount"]')
    return balance.textContent
  })
  const balance1 = 1 + maxAvailableAmount

  // Type the amount bigger than balance
  await typeText(page, amountField, balance1)

  // Verify that the message "The amount is greater than the asset's balance:" exist on the page
  const targetText = 'Insufficient amount.'
  // Wait until the specified text appears on the page
  await page.waitForFunction(
    (text) => {
      const element = document.querySelector('body')
      return element && element.textContent.includes(text)
    },
    {},
    targetText
  )
}

//--------------------------------------------------------------------------------------------------------------
export async function sendFundsToSmartContract(page, extensionURL) {
  await checkBalanceOfToken(page, usdcTokenSelector, 0.0002)

  await page.goto(`${extensionURL}/tab.html#/transfer`, { waitUntil: 'load' })
  await page.waitForSelector('[data-testid="max-available-amount"]')
  await selectUSDCTokenOnBase(page)

  // Type the amount
  await typeText(page, amountField, '0.0001')

  // Type the address of smart contract in the "Add Recipient" field
  await typeText(page, recipientField, '0x4e15361fd6b4bb609fa63c81a2be19d873717870')

  // Verify that the message "The amount is greater than the asset's balance:" exist on the page
  const targetText = 'You are trying to send tokens to a smart contract. Doing so would burn them.'
  // Wait until the specified text appears on the page
  await page.waitForFunction(
    (text) => {
      const element = document.querySelector('body')
      return element && element.textContent.includes(text)
    },
    {},
    targetText
  )
}
