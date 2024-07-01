import { PuppeteerScreenRecorder } from 'puppeteer-screen-recorder'

import {
  bootstrap,
  setAmbKeyStore,
  finishStoriesAndSelectAccount,
  clickOnElement,
  typeText,
  INVITE_STORAGE_ITEM
} from '../functions.js'

import {
  createAccountWithPhrase,
  createAccountWithInvalidPhrase,
  addViewOnlyAccount
} from '../common/login.js'

describe('ba_login', () => {
  let browser, page, extensionRootUrl, extensionId, recorder

  beforeEach(async () => {
    ;({ browser, extensionRootUrl, extensionId, backgroundTarget } = await bootstrap())
    const backgroundPage = await backgroundTarget.page()
    // Bypass the invite verification step
    await backgroundPage.evaluate(
      (invite) => chrome.storage.local.set({ invite }),
      JSON.stringify(INVITE_STORAGE_ITEM)
    )

    page = await browser.newPage()
    page.setDefaultTimeout(120000)

    recorder = new PuppeteerScreenRecorder(page)
    await recorder.start(`./recorder/ba_login_${Date.now()}.mp4`)
    await page.goto(`chrome-extension://${extensionId}/tab.html#/get-started`)
    await page.bringToFront()
  })

  afterEach(async () => {
    if (recorder) await recorder.stop()
    if (page) await page.close()
    if (browser) await browser.close()
  })

  const enterSeedPhraseField = '[data-testid="enter-seed-phrase-field"]'

  //------------------------------------------------------------------------------------------------------
  it('create basic and smart accounts with private key', async () => {
    await setAmbKeyStore(page, '[data-testid="button-import-private-key"]')
    await page.waitForSelector('[data-testid="enter-seed-phrase-field"]')

    await typeText(page, '[data-testid="enter-seed-phrase-field"]', process.env.BA_PRIVATE_KEY)

    // This function will complete the onboarding stories and will select and retrieve first basic and first smart account
    const { firstSelectedBasicAccount, firstSelectedSmartAccount } =
      await finishStoriesAndSelectAccount(page)

    // Click on "Save and Continue" button
    await clickOnElement(page, '[data-testid="button-save-and-continue"]')

    await page.waitForFunction(
      () => {
        return window.location.href.includes('/onboarding-completed')
      },
      { timeout: 60000 }
    )

    await page.goto(`${extensionRootUrl}/tab.html#/account-select`, { waitUntil: 'load' })

    // Verify that selected accounts exist on the page
    const selectedBasicAccount = await page.$$eval(
      '[data-testid="account"]',
      (el) => el[0].innerText
    )
    expect(selectedBasicAccount).toContain(firstSelectedBasicAccount)

    const selectedSmartAccount = await page.$$eval(
      '[data-testid="account"]',
      (el) => el[1].innerText
    )
    expect(selectedSmartAccount).toContain(firstSelectedSmartAccount)
  })

  //------------------------------------------------------------------------------------------------------
  it('create basic account with phrase', async () => {
    await createAccountWithPhrase(page, extensionRootUrl, process.env.BA_PASSPHRASE)
  })

  //------------------------------------------------------------------------------------------------------
  it('(-) login into account with invalid private key', async () => {
    await setAmbKeyStore(page, '[data-testid="button-import-private-key"]')

    const typeTextAndCheckValidity = async (privateKey) => {
      await typeText(page, enterSeedPhraseField, privateKey, { delay: 10 })

      // Check whether text "Invalid private key." exists on the page
      await page.$$eval('div[dir="auto"]', (element) => {
        return element.find((item) => item.textContent === 'Invalid private key.').textContent
      })

      // Check whether button is disabled
      const isButtonDisabled = await page.$eval('[data-testid="import-button"]', (button) => {
        return button.getAttribute('aria-disabled')
      })

      expect(isButtonDisabled).toBe('true')
    }

    // Test cases with different private keys
    await typeTextAndCheckValidity(
      '0000000000000000000000000000000000000000000000000000000000000000'
    )
    await page.$eval(enterSeedPhraseField, (el) => (el.value = ''))

    await typeTextAndCheckValidity('', 'Test 2')
    await page.$eval(enterSeedPhraseField, (el) => (el.value = ''))

    await typeTextAndCheckValidity(
      '00390ce7b96835258b010e25f9196bf4ddbff575b7c102546e9e40780118018'
    )
    await new Promise((r) => setTimeout(r, 1000))
    await page.$eval(enterSeedPhraseField, (el) => (el.value = ''))

    await typeTextAndCheckValidity(
      '03#90ce7b96835258b019e25f9196bf4ddbff575b7c102546e9e40780118018'
    )
  })

  //--------------------------------------------------------------------------------------------------------------
  it('(-) Login into basic account with invalid phrase', async () => {
    await createAccountWithInvalidPhrase(page)
  })

  //--------------------------------------------------------------------------------------------------------------
  it('change the name of the selected BA & SA account', async () => {
    await setAmbKeyStore(page, '[data-testid="button-import-private-key"]')

    await page.waitForSelector('[data-testid="enter-seed-phrase-field"]')

    await typeText(page, '[data-testid="enter-seed-phrase-field"]', process.env.BA_PRIVATE_KEY)

    // This function will complete the onboarding stories and will select and retrieve first basic and first smart account
    await finishStoriesAndSelectAccount(page)

    const accountName1 = 'Test-Account-1'
    const accountName2 = 'Test-Account-2'

    const editAccountNameFields = await page.$$('[data-testid="editable-button"]')

    await editAccountNameFields[0].click()
    await new Promise((r) => setTimeout(r, 500))

    await typeText(page, '[data-testid="edit-name-field-0"]', accountName1)

    await editAccountNameFields[1].click()
    await new Promise((r) => setTimeout(r, 500))

    await typeText(page, '[data-testid="edit-name-field-1"]', accountName2)

    // Click on the checkmark icon to save the new account names
    editAccountNameFields[0].click()
    editAccountNameFields[1].click()

    // Click on "Save and Continue" button
    await new Promise((r) => setTimeout(r, 1000))
    await clickOnElement(page, '[data-testid="button-save-and-continue"]:not([disabled])')

    await page.waitForFunction(
      () => {
        return window.location.href.includes('/onboarding-completed')
      },
      { timeout: 60000 }
    )

    await page.goto(`${extensionRootUrl}/tab.html#/account-select`, { waitUntil: 'load' })

    // Verify that selected accounts exist on the page
    const selectedBasicAccount = await page.$$eval(
      '[data-testid="account"]',
      (el) => el[0].innerText
    )
    expect(selectedBasicAccount).toContain(accountName1)

    const selectedSmartAccount = await page.$$eval(
      '[data-testid="account"]',
      (el) => el[1].innerText
    )
    expect(selectedSmartAccount).toContain(accountName2)
  })

  //--------------------------------------------------------------------------------------------------------------
  it('add view-only basic account', async () => {
    await addViewOnlyAccount(page, extensionRootUrl, '0x048d8573402CE085A6c8f34d568eC2Ccc995196e')
  })
})
