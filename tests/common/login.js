import {
  typeText,
  clickOnElement,
  finishStoriesAndSelectAccount,
  setAmbKeyStore
} from '../functions'

//--------------------------------------------------------------------------------------------------------------
export async function createAccountWithPhrase(page, extensionURL, phrase) {
  await setAmbKeyStore(page, '[data-testid="button-proceed-seed-phrase"]')

  const wordArray = phrase.split(' ')

  await page.waitForSelector('[placeholder="Word 1"]')
  for (let i = 0; i < wordArray.length; i++) {
    const wordToType = wordArray[i]

    // Type the word into the input field using page.type
    const inputSelector = `[placeholder="Word ${i + 1}"]`
    await page.type(inputSelector, wordToType)
  }

  // This function will complete the onboarding stories and will select and retrieve first basic and first smarts account
  const { firstSelectedBasicAccount, firstSelectedSmartAccount } =
    await finishStoriesAndSelectAccount(page, 'true')

  // Click on "Save and Continue" button
  await clickOnElement(page, '[data-testid="button-save-and-continue"]')
  await page.waitForFunction(() => window.location.href.includes('/onboarding-completed'))
  await page.goto(`${extensionURL}/tab.html#/account-select`, { waitUntil: 'load' })

  // Verify that selected accounts exist on the page
  await page.waitForFunction(
    (testId, requiredCount) => {
      return document.querySelectorAll(`[data-testid="${testId}"]`).length >= requiredCount
    },
    {},
    'address',
    2
  )
  const addresses = await page.$$eval('[data-testid="address"]', (el) => el.map((e) => e.innerText))
  expect(addresses).toContain(firstSelectedBasicAccount)
  expect(addresses).toContain(firstSelectedSmartAccount)
}

//--------------------------------------------------------------------------------------------------------------
export async function createAccountWithInvalidPhrase(page) {
  await setAmbKeyStore(page, '[data-testid="button-proceed-seed-phrase"]')

  await page.waitForSelector('[placeholder="Word 1"]')

  // This function types words in the passphrase fields and checks if the button is disabled.
  async function typeWordsAndCheckButton(passphraseWords) {
    const wordArray = passphraseWords.split(' ')

    for (let i = 0; i < wordArray.length; i++) {
      const wordToType = wordArray[i]

      // Type the word into the input field using page.type
      const inputSelector = `[placeholder="Word ${i + 1}"]`
      await page.type(inputSelector, wordToType)
    }

    // Check whether button is disabled
    const isButtonDisabled = await page.$eval('[data-testid="import-button"]', (button) => {
      return button.getAttribute('aria-disabled')
    })

    expect(isButtonDisabled).toBe('true')
  }

  // This function waits until an error message appears on the page.
  async function waitUntilError(validateMessage) {
    await page.waitForFunction(
      (text) => {
        const element = document.querySelector('body')
        return element && element.textContent.includes(text)
      },
      { timeout: 60000 },
      validateMessage
    )
  }

  // Try to login with empty phrase fields
  let passphraseWords = ''
  await typeWordsAndCheckButton(passphraseWords)

  // Test cases with different phrases keys
  passphraseWords = '00000 000000 00000 000000 00000 000000 00000 000000 00000 000000 00000 000000'
  await typeWordsAndCheckButton(passphraseWords)

  const errorMessage = 'Invalid Seed Phrase. Please review every field carefully.'
  // Wait until the error message appears on the page
  await waitUntilError(errorMessage)

  // Clear the passphrase fields before write the new phrase
  const wordArray = passphraseWords.split(' ')
  for (let i = 0; i < wordArray.length; i++) {
    const inputSelector = `[placeholder="Word ${i + 1}"]`
    await page.click(inputSelector, { clickCount: 3 }) // Select all content
    await page.keyboard.press('Backspace') // Delete the selected content
  }

  passphraseWords = 'allow survey play weasel exhibit helmet industry bunker fish step garlic ababa'
  await typeWordsAndCheckButton(passphraseWords)
  // Wait until the error message appears on the page
  await waitUntilError(errorMessage)
}

//--------------------------------------------------------------------------------------------------------------
export async function addViewOnlyAccount(page, extensionURL, viewOnlyAddress) {
  const buttonNext = '[data-testid="stories-button-next"]'
  await page.waitForSelector(buttonNext)

  // Click on "Next" button several times to finish the onboarding
  await page.$eval(buttonNext, (button) => button.click())

  await page.waitForSelector('[data-testid="stories-button-previous"]')

  await page.$eval(buttonNext, (button) => button.click())
  await page.$eval(buttonNext, (button) => button.click())
  await page.$eval(buttonNext, (button) => button.click())
  await page.$eval(buttonNext, (button) => button.click())

  // check the checkbox "I agree ..."
  await page.$eval('[data-testid="checkbox"]', (button) => button.click())
  // Click on "Got it"
  await page.$eval(buttonNext, (button) => button.click())

  // Select "Add"
  await clickOnElement(page, '[data-testid="get-started-button-add"]')

  await typeText(page, '[data-testid="address-ens-field"]', viewOnlyAddress)

  // Click on "Import View-Only Accounts" button
  await clickOnElement(page, '[data-testid="view-only-button-import"]')

  // Click on "Account"
  await clickOnElement(page, '[data-testid="button-save-and-continue"]')

  await page.goto(`${extensionURL}/tab.html#/account-select`, { waitUntil: 'load' })

  // Find the element containing the specified address
  const addressElement = await page.$x(`//*[contains(text(), '${viewOnlyAddress}')]`)

  if (addressElement.length > 0) {
    // Get the parent element of the element with the specified address
    const parentElement = await addressElement[0].$x('../../..')

    if (parentElement.length > 0) {
      // Get the text content of the parent element and all elements within it
      const parentTextContent = await page.evaluate((element) => {
        const elements = element.querySelectorAll('*')
        return Array.from(elements, (el) => el.textContent).join('\n')
      }, parentElement[0])

      // Verify that somewhere in the content there is the text 'View-only'
      const containsViewOnly = parentTextContent.includes('View-only')

      expect(containsViewOnly).toBe(true)
    }
  }
}
