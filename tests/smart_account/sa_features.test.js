import {
  typeText,
  clickOnElement,
  bootstrapWithStorage,
  saParams,
  selectMaticToken,
  triggerTransaction,
  signTransaction,
  confirmTransactionStatus,
  selectFeeToken,
  checkBalanceOfToken
} from '../functions'

const recipientField = '[data-testid="address-ens-field"]'
const amountField = '[data-testid="amount-field"]'

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
    // await browser.close()
  })
  //--------------------------------------------------------------------------------------------------------------
  it.skip('Top up gas tank', async () => {
    // Click on Matic (not Gas Tank token)
    await clickOnElement(
      page,
      '[data-testid="token-0x0000000000000000000000000000000000000000-polygon"]'
    )

    // Click on "Top Up Gas Tank"
    await clickOnElement(page, '[data-testid="top-up-button"]')

    await page.waitForFunction(
      () => {
        return window.location.href.includes('/transfer')
      },
      { timeout: 60000 }
    )

    await typeText(page, amountField, '0.0001')

    // Click on "Top Up" button and confirm transaction

    const newPage = await triggerTransaction(
      page,
      extensionURL,
      browser,
      '[data-testid="transfer-button-send"]'
    )

    // Check if select fee token is visible and select the token
    await selectFeeToken(
      newPage,
      '[data-testid="option-0x6224438b995c2d49f696136b2cb3fcafb21bd1e70x0000000000000000000000000000000000000000matic"]'
    )

    // Sign and confirm the transaction
    await signTransaction(newPage)
    await confirmTransactionStatus(newPage, 'polygon', 137)
  })

  //--------------------------------------------------------------------------------------------------------------
  it('Pay transaction fee with gas tank', async () => {
    // Click on "Send" button
    await clickOnElement(page, '[data-testid="dashboard-button-send"]')

    await page.waitForSelector(amountField)

    await selectMaticToken(page)

    // Type the amount
    await typeText(page, amountField, '0.0001')

    // Type the adress of the recipient
    await typeText(page, recipientField, '0xC254b41be9582e45a2aCE62D5adD3F8092D4ea6C')
    await page.waitForXPath(
      '//div[contains(text(), "You\'re trying to send to an unknown address. If you\'re really sure, confirm using the checkbox below.")]'
    )
    await page.waitForSelector('[data-testid="checkbox"]')
    await page.waitForSelector('[data-testid="recipient-address-unknown-checkbox"]')

    // Check the checkbox "I confirm this address is not a Binance wallets...."
    await clickOnElement(page, '[data-testid="checkbox"]')

    // Check the checkbox "Confirm sending to a previously unknown address"
    await clickOnElement(page, '[data-testid="recipient-address-unknown-checkbox"]')

    // Click on "Send" button and cofirm transaction
    const { actionWindowPage: newPage, transactionRecorder } = await triggerTransaction(
      page,
      extensionURL,
      browser,
      '[data-testid="transfer-button-send"]'
    )

    // Check if select fee token is visible and select the token
    await selectFeeToken(
      newPage,
      '[data-testid="option-0x6224438b995c2d49f696136b2cb3fcafb21bd1e70x0000000000000000000000000000000000000000maticgastank"]'
    )
    // Sign and confirm the transaction
    await signTransaction(newPage, transactionRecorder)
    await confirmTransactionStatus(newPage, 'polygon', 137, transactionRecorder)
  })

  //--------------------------------------------------------------------------------------------------------------
  it('Pay transaction fee with basic account', async () => {
    await page.goto(`${extensionURL}/tab.html#/transfer`, { waitUntil: 'load' })

    await page.waitForSelector(amountField)

    await selectMaticToken(page)

    // Type the amount
    await typeText(page, amountField, '0.0001')

    // Type the adress of the recipient
    await typeText(page, recipientField, '0xC254b41be9582e45a2aCE62D5adD3F8092D4ea6C')
    await page.waitForXPath(
      '//div[contains(text(), "You\'re trying to send to an unknown address. If you\'re really sure, confirm using the checkbox below.")]'
    )
    await page.waitForSelector('[data-testid="checkbox"]')
    await page.waitForSelector('[data-testid="recipient-address-unknown-checkbox"]')

    // Check the checkbox "I confirm this address is not a Binance wallets...."
    await clickOnElement(page, '[data-testid="checkbox"]')

    // Check the checkbox "Confirm sending to a previously unknown address"
    await clickOnElement(page, '[data-testid="recipient-address-unknown-checkbox"]')

    // Click on "Send" button and cofirm transaction
    const { actionWindowPage: newPage, transactionRecorder } = await triggerTransaction(
      page,
      extensionURL,
      browser,
      '[data-testid="transfer-button-send"]'
    )

    // Check if select fee token is visible and select the token
    await selectFeeToken(
      newPage,
      '[data-testid="option-0x630fd7f359e483c28d2b0babde1a6f468a1d649e0x0000000000000000000000000000000000000000matic"]'
    )
    // Sign and confirm the transaction
    await signTransaction(newPage, transactionRecorder)
    await confirmTransactionStatus(newPage, 'polygon', 137, transactionRecorder)
  })

  //--------------------------------------------------------------------------------------------------------------
  it('Make batched transaction', async () => {
    // Click on "Send" button
    await page.goto(`${extensionURL}/tab.html#/transfer`, { waitUntil: 'load' })

    await page.waitForSelector(amountField)

    await selectMaticToken(page)

    // Type the amount
    await typeText(page, amountField, '0.0001')
    const firstRecipient = '0xC254b41be9582e45a2aCE62D5adD3F8092D4ea6C'

    // Type the adress of the recipient
    await typeText(page, recipientField, firstRecipient)
    await page.waitForXPath(
      '//div[contains(text(), "You\'re trying to send to an unknown address. If you\'re really sure, confirm using the checkbox below.")]'
    )
    await page.waitForSelector('[data-testid="checkbox"]')
    await page.waitForSelector('[data-testid="recipient-address-unknown-checkbox"]')

    // Check the checkbox "I confirm this address is not a Binance wallets...."
    await clickOnElement(page, '[data-testid="checkbox"]')

    // Check the checkbox "Confirm sending to a previously unknown address"
    await clickOnElement(page, '[data-testid="recipient-address-unknown-checkbox"]')

    const elementToClick = await page.waitForSelector('[data-testid="transfer-button-send"]')
    await elementToClick.click()

    const newTarget = await browser.waitForTarget((target) =>
      target.url().startsWith(`${extensionURL}/action-window.html#`)
    )
    const newPage = await newTarget.page()
    await newPage.setViewport({
      width: 1300,
      height: 700
    })

    // Click on "Queue And Sign Later" button
    await clickOnElement(newPage, '[data-testid="queue-and-sign-later-button"]')

    await page.goto(`${extensionURL}/tab.html#/dashboard`, { waitUntil: 'load' })

    // Verify that  message exist on the dashboard page
    const pendingText = 'Transaction waiting to be signed on Polygon'

    await page.waitForFunction(
      (text) => {
        const element = document.querySelector('body')
        return element && element.textContent.includes(text)
      },
      {},
      pendingText
    )

    await page.goto(`${extensionURL}/tab.html#/transfer`, { waitUntil: 'load' })

    await page.waitForSelector(amountField)

    await selectMaticToken(page)

    // Type the amount
    await typeText(page, amountField, '0.0001')

    const secondRecipient = '0xe750Fff1AA867DFb52c9f98596a0faB5e05d30A6'

    // Type the adress of the recipient
    await typeText(page, recipientField, secondRecipient)

    // Type the adress of the recipient

    await page.waitForXPath(
      '//div[contains(text(), "You\'re trying to send to an unknown address. If you\'re really sure, confirm using the checkbox below.")]'
    )
    await page.waitForSelector('[data-testid="checkbox"]')
    await page.waitForSelector('[data-testid="recipient-address-unknown-checkbox"]')

    // Check the checkbox "I confirm this address is not a Binance wallets...."
    await clickOnElement(page, '[data-testid="checkbox"]')

    // Check the checkbox "Confirm sending to a previously unknown address"
    await clickOnElement(page, '[data-testid="recipient-address-unknown-checkbox"]')

    const { actionWindowPage, transactionRecorder } = await triggerTransaction(
      page,
      extensionURL,
      browser,
      '[data-testid="transfer-button-send"]:not([disabled])'
    )

    // Verify that both recipient addresses are visible ot the page
    await actionWindowPage.waitForFunction(
      (text1, text2) => {
        const element1 = document.querySelector('[data-testid^="recipient-address-0"]')
        const element2 = document.querySelector('[data-testid^="recipient-address-1"]')
        return (
          (element1 && element1.textContent.includes(text1)) ||
          (element2 && element2.textContent.includes(text2))
        )
      },
      {},
      firstRecipient,
      secondRecipient
    )

    // Check if select fee token is visible and select the token
    await selectFeeToken(
      actionWindowPage,
      '[data-testid="option-0x6224438b995c2d49f696136b2cb3fcafb21bd1e70x0000000000000000000000000000000000000000matic"]'
    )
    await signTransaction(actionWindowPage, transactionRecorder)
    await confirmTransactionStatus(actionWindowPage, 'polygon', 137, transactionRecorder)

    // Verify that both recipient addresses are visible
    await actionWindowPage.waitForFunction(
      (text1, text2) => {
        const body = document.querySelector('body')
        return body.textContent.includes(text1) && body.textContent.includes(text2)
      },
      {},
      firstRecipient,
      secondRecipient
    )
  })

  //--------------------------------------------------------------------------------------------------------------
  it.only('Send 0.0000001 ETH on Optimism.Pay with ETH', async () => {
    await checkBalanceOfToken(
      page,
      '[data-testid="token-0x0000000000000000000000000000000000000000-optimism"]',
      0.0007
    )
    // Click on Matic (not Gas Tank token)
    await clickOnElement(
      page,
      '[data-testid="token-0x0000000000000000000000000000000000000000-optimism"]'
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

    // Click on "Top Up Gas Tank"
    await clickOnElement(page, '[data-testid="token-send"]')

    await page.waitForFunction(
      () => {
        return window.location.href.includes('/transfer')
      },
      { timeout: 60000 }
    )

    await page.waitForSelector('[data-testid="amount-field"]')
    await typeText(page, '[data-testid="amount-field"]', '0.0000001') // Type the amount

    // Type the address of the recipient
    await typeText(page, recipientField, '0xC254b41be9582e45a2aCE62D5adD3F8092D4ea6C')
    await page.waitForXPath(
      '//div[contains(text(), "You\'re trying to send to an unknown address. If you\'re really sure, confirm using the checkbox below.")]'
    )
    await page.waitForSelector('[data-testid="recipient-address-unknown-checkbox"]')

    // Check the checkbox "Confirm sending to a previously unknown address"
    await page.waitForSelector('[data-testid="recipient-address-unknown-checkbox"]')
    await clickOnElement(page, '[data-testid="recipient-address-unknown-checkbox"]')

    // Check the checkbox "I confirm this address is not a Binance wallets...."
    const checkboxExists = await page.evaluate(
      () => !!document.querySelector('[data-testid="checkbox"]')
    )
    if (checkboxExists) await clickOnElement(page, '[data-testid="checkbox"]')

    // Click on "Send" button and cofirm transaction
    const { actionWindowPage: newPage, transactionRecorder } = await triggerTransaction(
      page,
      extensionURL,
      browser,
      '[data-testid="transfer-button-send"]'
    )

    // Check if select fee token is visible and select the token
    await selectFeeToken(
      newPage,
      '[data-testid="option-0x630fd7f359e483c28d2b0babde1a6f468a1d649e0x0000000000000000000000000000000000000000eth"]'
    )
    // Sign and confirm the transaction
    await signTransaction(newPage, transactionRecorder)
    await confirmTransactionStatus(newPage, 'optimism', 10, transactionRecorder)
  })
})
