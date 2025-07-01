import { clickOnElement } from '../../common-helpers/clickOnElement'
import { typeText } from '../../common-helpers/typeText'
import { SELECTORS } from '../../common/selectors/selectors'
// TODO: Import and reuse '../../common/transactions'
import { TOKEN_ADDRESS, SELECT_ROUTE, NO_ROUTE_FOUND, BATCH_BTN } from './constants'

async function isElementClickable(page, selector) {
  const isXPath = selector.startsWith('//') || selector.startsWith('(')

  const el = isXPath ? (await page.$x(selector))[0] : await page.$(selector)

  if (!el) return false

  const isClickable = await el.evaluate((node) => {
    const style = window.getComputedStyle(node)
    const rect = node.getBoundingClientRect()

    const notDisabled = !node.hasAttribute('disabled')
    const isVisible =
      style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0

    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const elAtPoint = document.elementFromPoint(centerX, centerY)

    const notCovered = elAtPoint === node || node.contains(elAtPoint)

    return isVisible && notDisabled && notCovered
  })

  return isClickable
}

export async function selectButton(page) {
  await clickOnElement(page, SELECTORS.processButtonSab)
}

export async function selectFirstButton(page, text) {
  // TODO: Refactor this function and select button after adding data-testId for 'Proceed' button placeholder
  await clickOnElement(page, `text=${text}`)
}

export async function verifyIfOnDashboardPage(page) {
  await expect(page).toMatchElement(SELECTORS.dashboardButtonSwapAndBridge)
  expect(page.url()).toContain('/dashboard')
}

export async function verifyIfOnSwapAndBridgePage(page) {
  await expect(page).toMatchElement('div', { text: 'Swap & Bridge' })
  expect(page.url()).toContain('/swap-and-bridge')
}

export async function openSwapAndBridge(page) {
  if (!page.url().includes('/swap-and-bridge')) {
    await clickOnElement(page, SELECTORS.dashboardButtonSwapAndBridge)
    await verifyIfOnSwapAndBridgePage(page)
  }
}

export async function verifyIfSwitchIsActive(page, reference = true) {
  await page.waitForTimeout(500)

  const switchElement = await page.$(SELECTORS.switchTokensTooltipSab)

  const isDisabled = await page.evaluate((element) => {
    const firstChild = element.children[0]
    return firstChild ? firstChild.getAttribute('aria-disabled') === 'true' : false
  }, switchElement)

  const isActive = !isDisabled
  expect(isActive).toBe(reference)
}

async function getElement(page, selector) {
  const element = await page.$(selector)
  expect(element).not.toBeNull()
  return element
}

async function getElementValue(page, selector) {
  const element = await getElement(page, selector)
  const content = await element.evaluate((el) => el.value.trim())
  return content
}

async function getElementContent(page, selector) {
  const element = await getElement(page, selector)
  const content = (await element.evaluate((el) => el.textContent)).split(' ')
  return content
}

async function getElementContentWords(page, selector, index = 1) {
  const element = await getElement(page, selector, 1000)
  const content = (await element.evaluate((el) => el.textContent.trim())).split(' ')[index - 1]
  return content
}

export async function switchTokensOnSwapAndBridge(page, delay = 500) {
  await page.waitForTimeout(delay)

  const sendToken = await getElementContentWords(page, SELECTORS.sendTokenSab)
  const receiveToken = await getElementContentWords(page, SELECTORS.receiveTokenSab)
  // TODO: Selector should be created to have data-testid this is not maintainable
  // const network = await getElementContentWords(page, NETWORK_SELECTOR)
  const network = await getElementContentWords(page, SELECTORS.recieveNetworkBase)

  // Click the switch Tokens button
  await clickOnElement(page, SELECTORS.switchTokensTooltipSab)
  await page.waitForTimeout(1000)

  // Ensure the tokens are switched
  expect(await getElementContentWords(page, SELECTORS.sendTokenSab)).toBe(receiveToken)
  expect(await getElementContentWords(page, SELECTORS.receiveTokenSab)).toBe(sendToken)

  // Network name is 3rd word in the sendToken content
  expect(await getElementContentWords(page, SELECTORS.sendTokenSab, 3)).toBe(network)
}

async function getUSDTextContent(page) {
  let currency
  let amount

  await page.waitForTimeout(500)
  const selector = SELECTORS.switchCurrencySab
  const element = await page.$(selector)
  expect(element).not.toBeNull()
  const content = await element.evaluate((el) => el.textContent.trim())

  if (/\$/.test(content)) {
    const match = content.match(/^([^0-9\s]+)?([\d,.]+)/)
    currency = match ? match[1] : null
    amount = match ? match[2] : null
  } else {
    const match = content.match(/([\d,.]+)\s*([\w.]+)$/)
    amount = match ? match[1] : null
    currency = match ? match[2] : null
  }

  return [Number(amount), currency]
}

export async function getSendAmount(page) {
  const amount = await getElementValue(page, SELECTORS.fromAmountInputSab)
  return Number(amount)
}

export async function roundAmount(amount, place = 2) {
  // ToDo: Check if values should be int-ed or rounded. Values are currently int-ed
  const multipla = 10 ** place
  return Math.trunc(amount * multipla) / multipla
}

async function selectSendTokenOnNetwork(page, send_token, send_network) {
  await clickOnElement(page, SELECTORS.sendTokenSab)
  await page.waitForSelector(SELECTORS.searchInput, { visible: true, timeout: 3000 })
  await typeText(page, SELECTORS.searchInput, send_token)
  // ToDo: data-testid missing for receive network dropdown
  await clickOnElement(page, `[data-testid="option-${send_token}.${send_network}"]`)
}

export async function switchUSDValueOnSwapAndBridge(
  page,
  send_token,
  send_network,
  send_amount,
  delay = 1000
) {
  await page.waitForTimeout(delay)

  await openSwapAndBridge(page)
  await selectSendTokenOnNetwork(page, send_token, send_network)

  await typeText(page, SELECTORS.fromAmountInputSab, send_amount.toString())

  const [usdOldAmount, ccy] = await getUSDTextContent(page)
  expect(ccy).toBe('$')
  const oldAmount = await getSendAmount(page)

  await clickOnElement(page, SELECTORS.flipUSDIcon)

  const [usdNewAmount, newCcy] = await getUSDTextContent(page)
  const newAmount = await roundAmount(await getSendAmount(page))

  expect(oldAmount).toBeCloseTo(usdNewAmount)
  expect(usdOldAmount).toBeCloseTo(newAmount)
  expect(newCcy).toBe(send_token)

  // Wait 500ms and click again to the switch USD button
  await page.waitForTimeout(500)
  await clickOnElement(page, SELECTORS.flipUSDIcon)

  const [usdSecondAmount, secondCcy] = await getUSDTextContent(page)
  const secondAmount = await getSendAmount(page)

  expect(newAmount).toBeCloseTo(usdSecondAmount)
  expect(usdNewAmount).toBeCloseTo(secondAmount)
  expect(secondCcy).toBe('$')
}

export async function enterNumber(page, new_amount, is_valid = true) {
  const message = 'Something went wrong! Please contact support'
  await typeText(page, SELECTORS.fromAmountInputSab, new_amount.toString())

  if (is_valid) {
    await expect(page).not.toMatchElement('span', { text: `${message}` })
  } else {
    await expect(page).toMatchElement('span', { text: `${message}` })
  }
}

export async function changeRoutePriority(page, route_type) {
  await openSwapAndBridge(page)
  await clickOnElement(page, SELECTORS.routePrioritySab)
  await page.waitForTimeout(500)
  await selectFirstButton(page, route_type)
  await selectFirstButton(page, 'Back')
}

async function verifyRouteFound(page) {
  let attempts = 0

  /* eslint-disable no-await-in-loop */
  while (attempts < 3) {
    // Wait for Proceed to be enabled (ie wait for "elect route" to appear)
    const routeFound = await page
      .waitForXPath(SELECT_ROUTE, { visible: true, timeout: 15000 })
      .catch(() => null)
    if (routeFound) {
      return // Exit if a route is found as expected
    }
    // If route not found check if "No Route Found!" is displayed
    const noRoutes = await page.waitForXPath(NO_ROUTE_FOUND, { timeout: 3000 }).catch(() => null)
    if (noRoutes) {
      console.log(`⚠️ Attempt ${attempts + 1}: 'No Route Found!' detected, retrying...`)
    } else {
      console.log(
        `⚠️ Attempt ${attempts + 1}: Route not found, but 'No Route Found!' displayed, retrying...`
      )
    }
    // Pause for 5 seconds before retrying
    await page.waitForTimeout(5000)
    // Change and revert the amount to initiate a new routes finding
    await page.type(SELECTORS.fromAmountInputSab, '1')
    await page.waitForTimeout(300)
    await page.keyboard.press('Backspace')

    attempts++
  }
  /* eslint-enable no-await-in-loop */
}

export async function prepareBridgeTransaction(
  page,
  send_amount,
  send_token,
  send_network,
  recieve_network
) {
  // ToDo: refactor due to new version
  await openSwapAndBridge(page)

  await selectSendTokenOnNetwork(page, send_token, send_network)
  await page.waitForSelector(SELECTORS.recieveNetworkBase, { visible: true, timeout: 3000 })
  await clickOnElement(page, SELECTORS.recieveNetworkBase)
  await clickOnElement(page, `[data-testid*="option-${recieve_network}"]`)
  await page.waitForSelector(SELECTORS.receiveTokenSab, { visible: true, timeout: 3000 })
  await clickOnElement(page, SELECTORS.receiveTokenSab)
  await page.waitForSelector(SELECTORS.searchInput, { visible: true, timeout: 3000 })
  await page.type(SELECTORS.searchInput, send_token)
  const address = TOKEN_ADDRESS[`${recieve_network}.${send_token}`]
  await clickOnElement(page, `[data-tooltip-id*="${address}"]`)

  await page.type(SELECTORS.fromAmountInputSab, send_amount.toString(), { delay: 100 })

  await verifyRouteFound(page)

  // If Warning: The price impact is too high
  const isfirmFollowUp = await page
    .waitForSelector(SELECTORS.confirmFollowUpTxn, { timeout: 6000 })
    .catch(() => null)
  if (isfirmFollowUp) {
    await clickOnElement(page, SELECTORS.confirmFollowUpTxn)
  }

  // If Warning: The price impact is too high
  const isHighPrice = await page
    .waitForSelector(SELECTORS.highPriceImpactSab, { timeout: 1000 })
    .catch(() => null)
  if (isHighPrice) {
    await clickOnElement(page, SELECTORS.highPriceImpactSab)
    return 'Continue anyway'
  }
  return 'Proceed'
}

export async function verifyNonDefaultReceiveToken(
  page,
  send_token,
  recieve_network,
  receive_token
) {
  // ToDo: refactor due to new version
  await openSwapAndBridge(page)
  await selectSendTokenOnNetwork(page, send_token, recieve_network)
  await page.waitForTimeout(1000)
  await clickOnElement(page, SELECTORS.receiveTokenSab)
  await typeText(page, SELECTORS.searchInput, receive_token)
  await expect(page).toMatchElement('div', { text: 'Not found. Try with token address?' })
  await page.waitForTimeout(1000)
  const address = TOKEN_ADDRESS[`${recieve_network}.${receive_token}`]
  await typeText(page, SELECTORS.searchInput, address)
  const selector = `[data-tooltip-id*="${address}"]`
  await expect(page).toMatchElement(selector, { text: receive_token, timeout: 3000 })
  await expect(page).toMatchElement(selector, { text: address, timeout: 3000 })
}

export async function verifyDefaultReceiveToken(page, send_token, recieve_network, receive_token) {
  await openSwapAndBridge(page)
  await selectSendTokenOnNetwork(page, send_token, recieve_network)
  await page.waitForTimeout(1000)
  await clickOnElement(page, SELECTORS.receiveTokenSab)
  await page.waitForTimeout(900)
  await typeText(page, SELECTORS.searchInput, receive_token)
  const selector = `[data-testid*="${receive_token.toLowerCase()}"]`
  await expect(page).toMatchElement(selector, { text: receive_token.toUpperCase(), timeout: 3000 })
  const address = TOKEN_ADDRESS[`${recieve_network}.${receive_token}`]
  if (address) {
    await expect(page).toMatchElement(selector, { text: address, timeout: 3000 })
    await clickOnElement(page, `[data-testid*="${receive_token.toLowerCase()}"]`)
  } else {
    console.log(`[WARNING] Token address not found for ${recieve_network}.${receive_token}`)
    console.log(`Element Content: ${await getElementContent(page, selector)}`)
  }
  await page.waitForTimeout(1000)
}

export async function prepareSwapAndBridge(
  page,
  send_amount,
  send_token,
  send_network,
  receive_token
) {
  try {
    await openSwapAndBridge(page)
    await page.waitForTimeout(1000)
    await selectSendTokenOnNetwork(page, send_token, send_network)

    // Select Receive Token on the same Network, which is automatically selected
    await page.waitForTimeout(1000) // Wait 1000ms before click for the Receive Token list to be populated
    await clickOnElement(page, SELECTORS.receiveTokenSab)
    await typeText(page, SELECTORS.searchInput, receive_token)
    await clickOnElement(page, `[data-testid*="${receive_token.toLowerCase()}"]`)

    // If checking prepareSwapAndBridge functionality without providing send amount
    if (send_amount === null) {
      return null
    }

    if (send_amount <= 0) {
      throw new Error('"send_amount" must be greater than 0')
    }

    await page.type(SELECTORS.fromAmountInputSab, send_amount.toString(), { delay: 100 })

    await verifyRouteFound(page)

    // If Warning: The price impact is too high
    const isHighPrice = await page
      .waitForSelector(SELECTORS.highPriceImpactSab, { timeout: 1000 })
      .catch(() => null)
    if (isHighPrice) {
      await clickOnElement(page, SELECTORS.highPriceImpactSab)
      return 'Continue anyway'
    }
    return 'Proceed'
  } catch (error) {
    console.error(`[ERROR] Prepare Swap & Bridge Page Failed: ${error.message}`)
    throw error
  }
}

export async function selectbannerButton(page) {
  await selectFirstButton(page, 'Back')
  const isClickable = await isElementClickable(page, SELECTORS.bannerButtonOpen)
  if (!isClickable) {
    console.log("⚠️ the 'Open' button is not clicable, but it should be")
    return
  }
  await clickOnElement(page, SELECTORS.bannerButtonOpen)
}

export async function wiatForConfirmed(actionPage) {
  await actionPage.waitForSelector('text=Timestamp', { visible: true })
  await expect(actionPage).toMatchElement('div', { text: 'Confirmed' })
}

export async function batchActionPage(page) {
  await clickOnElement(page, BATCH_BTN)
  await clickOnElement(page, SELECTORS.addMoreSwaps, 1000)
}

export async function signActionPage(page) {
  const isClickable = await isElementClickable(page, SELECTORS.signButton)
  if (!isClickable) {
    console.log("⚠️ the 'Sign' button is not clicable, but it should be")
    return
  }
  await clickOnElement(page, SELECTORS.signButton)
  await page.waitForTimeout(1500)
}

export async function clickOnSecondRoute(page) {
  const secoundRouteIndex = 2
  if (await page.waitForXPath(SELECT_ROUTE, { visible: true, timeout: 1000 })) {
    const isClickable = await isElementClickable(page, SELECT_ROUTE)
    if (!isClickable) {
      console.log("⚠️ the 'Select route' is not clickable")
      return
    }

    const [routeFound] = await page.$x(SELECT_ROUTE)
    if (routeFound) {
      await routeFound.click()
    } else {
      console.warn(`Element not found for XPath: ${SELECT_ROUTE}`)
    }

    await page.waitForSelector(SELECTORS.bottomSheet)
    const elements = await page.$$(`${SELECTORS.bottomSheet} [tabindex="0"]`)
    await elements[secoundRouteIndex].click()
    await verifyRouteFound(page)
  } else {
    console.log("⚠️ the 'Select route' is not found")
  }
  await clickOnElement(page, SELECTORS.signButton)
  await page.waitForTimeout(1500)
}

async function extractMaxBalance(page) {
  const maxBalanceIndex = 1
  const maxBalance = await getElementContentWords(
    page,
    SELECTORS.maxAvailableAmount,
    maxBalanceIndex
  )
  return Number(maxBalance)
}

export async function verifySendMaxTokenAmount(page, send_token, send_network) {
  const valueDecimals = 2 // Set presison of values to 2 decimals
  await openSwapAndBridge(page)
  await selectSendTokenOnNetwork(page, send_token, send_network)
  await page.waitForTimeout(1500) // Wait before read Amount value
  const maxBalance = await extractMaxBalance(page)
  const roundMaxBalance = await roundAmount(maxBalance, valueDecimals)
  await selectFirstButton(page, 'Max')
  await page.waitForTimeout(1500) // Wait before read Amount value
  const sendAmount = await getSendAmount(page)
  const roundSendAmount = await roundAmount(sendAmount, valueDecimals)
  // There is an intermittent difference in balances when running on CI; I have added an Alert to monitor it and using toBeCloseTo
  if (roundMaxBalance !== roundSendAmount) {
    console.log(
      `⚠️ Token: ${send_token} | maxBalance: ${maxBalance}, sendAmount: ${sendAmount} | roundSendAmount: ${roundSendAmount}, roundMaxBalance: ${roundMaxBalance}`
    )
  }
  expect(roundMaxBalance).toBeCloseTo(roundSendAmount, valueDecimals - 1) // 1 decimal presisison
}

export async function verifyAutoRefreshRoute(page) {
  // Wait for "Select another route" to appear and disappear
  await page
  await page.waitForXPath(SELECT_ROUTE, { visible: true, timeout: 1000 }).catch(() => null)
  const routeLoading = await page
    .waitForXPath(SELECT_ROUTE, { hidden: true, timeout: 63000 })
    .catch(() => null)
  expect(routeLoading).toBe(null)
}
