import { clickOnElement } from '../../common-helpers/clickOnElement'
import { SELECTORS, TEST_IDS } from '../../common/selectors/selectors'
import { buildSelector } from '../../common-helpers/buildSelector'
import { typeText } from '../../common-helpers/typeText'
import { checkStorageKeysExist } from '../../common-helpers/checkStorageKeysExist'
import { setAmbKeyStore } from '../../common-helpers/setAmbKeyStore'
import {
  URL_ACCOUNT_SELECT,
  TEST_ACCOUNT_NAMES,
  INVALID_SEED_PHRASE_ERROR_MSG,
  PIN_THE_AMBIRE_EXTENSION,
  MODAL_BACKDROP
} from './constants'

/* eslint-disable no-promise-executor-return */
export async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function checkAccountDetails(
  page,
  selector,
  expectedAccountNames,
  expectedAccountDetails
) {
  await page.waitForSelector(selector, { visible: true })

  // TODO: Investigate and replace with a proper condition instead of using a fixed wait time.
  // Note: This wait is required because there is a case that the account address is loading with some delay because of the ENS resolving.
  await wait(1500)

  const addedAccounts = await page.$$eval(selector, (elements) =>
    elements.map((element) => element.innerText)
  )

  expect(addedAccounts.length).toBe(expectedAccountNames.length)

  expectedAccountNames.forEach((expectedAccount, index) => {
    expect(addedAccounts[index]).toContain(expectedAccount)
    if (expectedAccountDetails && expectedAccountDetails.length && expectedAccountDetails[index]) {
      expect(addedAccounts[index]).toContain(expectedAccountDetails[index])
    }
  })
}

export async function finishStoriesAndSelectAccount(
  page,
  skipStories = false,
  hideEmptyBasicAccounts = false
) {
  await page.waitForFunction(() => window.location.href.includes('/account-adder'))

  if (!skipStories) {
    await clickOnElement(page, 'xpath///a[contains(text(), "Next")]', true, 1500)
    await clickOnElement(page, 'xpath///a[contains(text(), "Got it")]', true, 500)
  }

  // Hide empty basic accounts
  if (hideEmptyBasicAccounts) {
    await clickOnElement(page, '[testid="hide-empty-accounts-toggle"]', true, 1500)
  }

  // Select one Legacy and one Smart account and keep the addresses of the accounts
  await page.waitForSelector(SELECTORS.checkbox, { visible: true })

  // Get an array with all the account addresses from the list
  const accountAddresses = await page.$$eval(SELECTORS.addAccountField, (elements) =>
    elements
      .map((element) => element.innerText)
      .filter((item) => {
        // Regular expression to match a valid Ethereum address
        const validAddressRegex = /^0x[a-fA-F0-9]{40}$/
        return validAddressRegex.test(item)
      })
  )

  // Take the first two accounts from the list
  const [firstAddress, secondAddress] = accountAddresses

  // if exist generate selectors for these account addresses
  const firstAddrSelector = firstAddress
    ? buildSelector(TEST_IDS.addAccount, firstAddress)
    : undefined
  const secondAddrSelector = secondAddress
    ? buildSelector(TEST_IDS.addAccount, secondAddress)
    : undefined

  if (firstAddrSelector) await clickOnElement(page, firstAddrSelector)
  if (secondAddrSelector) await clickOnElement(page, secondAddrSelector)

  const firstSelectedAccount = firstAddrSelector
    ? await page.$eval(firstAddrSelector, (element) => {
        return element.textContent
      })
    : null
  const secondSelectedAccount = secondAddrSelector
    ? await page.$eval(secondAddrSelector, (element) => {
        return element.textContent
      })
    : null

  await Promise.all([
    // Click on Import Accounts button
    clickOnElement(page, `${SELECTORS.buttonImportAccount}:not([disabled])`),
    page.waitForNavigation()
  ])
  const currentUrl = page.url()
  expect(currentUrl).toContain('/account-personalize')
  return { firstSelectedAccount, secondSelectedAccount }
}

export async function typeSeedWords(page, passphraseWords) {
  const wordArray = passphraseWords.split(' ')

  for (let i = 0; i < wordArray.length; i++) {
    const wordToType = wordArray[i]

    // Type the word into the input field using page.type
    const inputSelector = buildSelector(TEST_IDS.seedPhraseInputFieldDynamic, i + 1)
    // eslint-disable-next-line no-await-in-loop
    await page.type(inputSelector, wordToType)
  }
}

async function expectImportButtonToBeDisabled(page) {
  const isButtonDisabled = await page.$eval(SELECTORS.importBtn, (button) => {
    return button.getAttribute('aria-disabled')
  })

  expect(isButtonDisabled).toBe('true')
}

export async function clearSeedWordsInputs(page, passphraseWords) {
  for (let i = 0; i < passphraseWords.split(' ').length; i++) {
    // Type the word into the input field using page.type
    const inputSelector = buildSelector(TEST_IDS.seedPhraseInputFieldDynamic, i + 1)
    // eslint-disable-next-line no-await-in-loop
    await page.click(inputSelector, { clickCount: 3 }) // Select all content
    // eslint-disable-next-line no-await-in-loop
    await page.keyboard.press('Backspace') // Delete the selected content
  }
}

// This function waits until an error message appears on the page.
export async function waitUntilError(page, validateMessage) {
  await page.waitForFunction(
    (text) => {
      const element = document.querySelector('body')
      return element && element.textContent.includes(text)
    },
    { timeout: 60000 },
    validateMessage
  )
}

export async function typeSeedAndExpectImportButtonToBeDisabled(page, seedWords) {
  await typeSeedWords(page, seedWords)
  await expectImportButtonToBeDisabled(page)
}

export function buildSelectorsForDynamicTestId(testId, arrayOfIndexes) {
  return arrayOfIndexes.map((_, index) => buildSelector(testId, index))
}

export async function checkTextAreaHasValidInputByGivenText(
  page,
  invalidPrivateKey,
  selectorInputField,
  selectorImportButton,
  errorMsg
) {
  await typeText(page, selectorInputField, invalidPrivateKey, { delay: 10 })

  if (invalidPrivateKey !== '') {
    // Wait for the error message to appear if the private key is invalid
    await page.waitForFunction(
      (errMsg) => {
        return Array.from(document.querySelectorAll('div[dir="auto"]')).some(
          (item) => item.textContent === errMsg
        )
      },
      {},
      errorMsg
    )

    // Ensure the error message appears
    const isDivContainsInvalidPrivKey = await page.$$eval(
      'div[dir="auto"]',
      (elements, errMsg) => {
        return elements.some((item) => item.textContent === errMsg)
      },
      errorMsg
    )

    expect(isDivContainsInvalidPrivKey).toBe(true)
  }

  // Check whether button is disabled
  const isButtonDisabled = await page.$eval(selectorImportButton, (button) => {
    return button.getAttribute('aria-disabled')
  })

  expect(isButtonDisabled).toBe('true')

  // Clear the TextArea
  await page.click(selectorInputField, { clickCount: 3 })
  await page.keyboard.press('Backspace')
}

export async function getInputValuesFromFields(_page) {
  const inputSelectors = Array.from({ length: 12 }, (_, i) =>
    buildSelector(TEST_IDS.recoveryWithSeedWordDyn, i)
  )
  const inputValues = await Promise.all(
    inputSelectors.map(async (selector) => {
      await _page.waitForSelector(selector)
      const value = await _page.$eval(selector, (input) => input.value)
      return value
    })
  )
  return inputValues
}

export async function personalizeAccountName(page, newName, accIndex = 0) {
  await clickOnElement(page, buildSelector(TEST_IDS.editBtnForEditNameField, accIndex))
  await typeText(page, buildSelector(TEST_IDS.editFieldNameField, accIndex), newName)
  await clickOnElement(page, buildSelector(TEST_IDS.editBtnForEditNameField, accIndex))
}

export async function importNewSAFromDefaultSeedAndPersonalizeIt(page, extensionURL) {
  // Click on "Add Account"
  await clickOnElement(page, SELECTORS.buttonAddAccount)

  // TODO: Investigate and replace with a proper condition instead of using a fixed wait time.
  await wait(500)
  // Wait until modal is getting visible
  await page.waitForSelector(SELECTORS.bottomSheet, { visible: true })

  // Click on "Import a new Smart Account from the default Seed Phrase" button
  // Note: Added a delay of 500ms because of the importing process
  await clickOnElement(page, SELECTORS.importFromSavedSeed, true, 500)

  await finishStoriesAndSelectAccount(page, true, true)

  const [accountName1, accountName2] = TEST_ACCOUNT_NAMES
  await personalizeAccountName(page, accountName1, 0)
  await personalizeAccountName(page, accountName2, 1)

  // Click on "Save and Continue" button
  await clickOnElement(page, `${SELECTORS.saveAndContinueBtn}:not([disabled])`)

  await page.waitForFunction(() => window.location.href.includes('/dashboard'))

  await page.goto(`${extensionURL}${URL_ACCOUNT_SELECT}`, { waitUntil: 'load' })

  await page.waitForSelector(SELECTORS.account, { visible: true })
}

export async function createHotWalletWithSeedPhrase(page, serviceWorker, extensionURL) {
  // Click on "Create new or import an existing hot wallet" button
  await clickOnElement(page, SELECTORS.getStartedBtnImport)

  // Click on Seed Phrase "Proceed" button
  await clickOnElement(page, SELECTORS.buttonProceedSeedPhrase)

  // Click on "Create seed" button.
  // We add a delay because the selector is part of an animated modal, and clicking on the selector
  // doesn't update the React state. This is most likely because the element is present in the DOM
  // but still outside the clickable viewport.
  await clickOnElement(page, SELECTORS.createSeedBtn, true, 500)

  // Wait for keystore to be loaded
  await page.waitForFunction(() => window.location.href.includes('/keystore-setup'))

  // type Device password
  const phrase = 'Password'
  await typeText(page, SELECTORS.enterPassField, phrase)
  await typeText(page, SELECTORS.repeatPassField, phrase)

  // Click on "Set up Ambire Key Store" button
  await clickOnElement(page, SELECTORS.keystoreBtnCreate)

  // TODO: Investigate and replace with a proper condition instead of using a fixed wait time.
  // Wait until the "Device password" modal is getting visible
  await wait(1000)

  await page.waitForSelector(SELECTORS.bottomSheet)

  // We add a delay because the selector is part of an animated modal, and clicking on the selector
  // doesn't update the React state. This is most likely because the element is present in the DOM
  // but still outside the clickable viewport.
  await clickOnElement(page, SELECTORS.keystoreBtnContinue, true, 500)

  const isKeyStoreUidKeyPresent = await checkStorageKeysExist(serviceWorker, 'keyStoreUid')
  expect(isKeyStoreUidKeyPresent).toBe(true)

  // Wait until create seed phrase loaded
  await page.waitForFunction(() => window.location.href.includes('/create-new-recovery-phrase'))

  // Check all the checkboxes
  await clickOnElement(page, buildSelector(TEST_IDS.createSeedPrepareCheckboxDyn, 0))
  await clickOnElement(page, buildSelector(TEST_IDS.createSeedPrepareCheckboxDyn, 1))
  await clickOnElement(page, buildSelector(TEST_IDS.createSeedPrepareCheckboxDyn, 2))

  // Wait until the "Review seed phrase" button to be enabled
  await page.waitForSelector(`${SELECTORS.reviewSeedPhraseBtn}:not([disabled])`, {
    visible: true
  })
  // Click on "Review seed phrase" button
  await clickOnElement(page, SELECTORS.reviewSeedPhraseBtn)
  await page.waitForFunction(() => window.location.href.includes('/backup-recovery-phrase'))

  // Get seed values from all the input fields
  const storedSeed = await getInputValuesFromFields(page)
  expect(storedSeed.length).toBe(12)

  // Click on "Continue" button
  await clickOnElement(page, SELECTORS.createSeedPhraseWriteContinueBtn)
  await page.waitForFunction(() => window.location.href.includes('/create-seed-phrase/confirm'))

  // Get the positions of the seed words
  const positionsOfSeedWords = await page.$$eval(SELECTORS.seedWordNumberToBeEntered, (elements) =>
    elements.map((element) => Number(element.innerText.replace('#', '')))
  )

  expect(positionsOfSeedWords.length).toBe(4)

  // Write exact seed word on exact position
  // eslint-disable-next-line no-restricted-syntax
  for (const position of positionsOfSeedWords) {
    // eslint-disable-next-line no-await-in-loop
    const inputSelector = buildSelector(TEST_IDS.seedWordPositionFieldDyn, position)
    // eslint-disable-next-line no-await-in-loop
    await page.type(inputSelector, storedSeed[position - 1])
  }

  // Wait Continue btn to be enabled then click on it
  await clickOnElement(page, SELECTORS.createSeedPhraseConfirmContinueBtn)

  await page.waitForNavigation({ waitUntil: 'load' })

  const { firstSelectedAccount, secondSelectedAccount } = await finishStoriesAndSelectAccount(
    page,
    false,
    true
  )

  const [accountName1, accountName2] = TEST_ACCOUNT_NAMES
  await personalizeAccountName(page, accountName1, 0)
  await personalizeAccountName(page, accountName2, 1)

  // Click on "Save and Continue" button
  await clickOnElement(page, `${SELECTORS.saveAndContinueBtn}:not([disabled])`)

  await page.waitForFunction(() => window.location.href.includes('/dashboard'))

  // in the case of "Pin the Ambire extension" popup
  const popup = await page.$x(PIN_THE_AMBIRE_EXTENSION, {
    timeout: 5000
  })
  if (popup.length > 0) {
    await clickOnElement(page, MODAL_BACKDROP)
  }

  await page.goto(`${extensionURL}${URL_ACCOUNT_SELECT}`, { waitUntil: 'load' })

  await page.waitForSelector(SELECTORS.account, { visible: true })

  await checkAccountDetails(
    page,
    SELECTORS.account,
    [accountName1, accountName2],
    [firstSelectedAccount, secondSelectedAccount]
  )
}

async function testWithInvalidSeedPhrase(page, invalidSeeds) {
  // Try to login with empty phrase fields
  await typeSeedAndExpectImportButtonToBeDisabled(page, '')

  expect(invalidSeeds.length).toBe(2)

  const [firstInvalidSeed, secondInvalidSeed] = invalidSeeds

  // Type seed words from the first incorrect seed
  await typeSeedAndExpectImportButtonToBeDisabled(page, firstInvalidSeed)
  // Wait until the error message appears on the page
  await waitUntilError(page, INVALID_SEED_PHRASE_ERROR_MSG)

  // Clear the passphrase fields before write the new phrase
  await clearSeedWordsInputs(page, firstInvalidSeed)

  // Type seed words from the second incorrect seed
  await typeSeedAndExpectImportButtonToBeDisabled(page, secondInvalidSeed)
  // Wait until the error message appears on the page
  await waitUntilError(page, INVALID_SEED_PHRASE_ERROR_MSG)

  // Clear the passphrase fields before write the new phrase
  await clearSeedWordsInputs(page, secondInvalidSeed)
}

export async function importAccountsFromSeedPhrase(page, extensionURL, seed, invalidSeeds) {
  await setAmbKeyStore(page, SELECTORS.buttonProceedSeedPhrase)

  const firstSeedInputField = buildSelector(TEST_IDS.seedPhraseInputFieldDynamic, 1)
  await page.waitForSelector(firstSeedInputField)

  if (seed.split(' ').length === 24) {
    // Click on dropdown and select a "24 words seed phrase"
    await clickOnElement(page, SELECTORS.selectSeedPhraseLength)

    await clickOnElement(page, SELECTORS.option24WordsSeedPhrase)
  }

  await testWithInvalidSeedPhrase(page, invalidSeeds)

  await typeSeedWords(page, seed)

  // Click on Import button.
  await clickOnElement(page, SELECTORS.importBtn)

  const { firstSelectedAccount, secondSelectedAccount } = await finishStoriesAndSelectAccount(page)

  const [accountName1, accountName2] = TEST_ACCOUNT_NAMES
  await personalizeAccountName(page, accountName1, 0)
  await personalizeAccountName(page, accountName2, 1)

  // Click on "Save and Continue" button
  await clickOnElement(page, `${SELECTORS.saveAndContinueBtn}:not([disabled])`)

  // Click on "Save" button in "Save the imported seed" page, which saves the seed and redirect to the dashboard
  await clickOnElement(page, SELECTORS.saveAsDefaultSeedBtn)

  // Wait until dashboard is loaded
  await page.waitForFunction(() => window.location.href.includes('/dashboard'))

  // Click on "Pin the extension"
  await clickOnElement(page, SELECTORS.pinExtensionCloseBtn)

  // Go to "Account select" page
  await page.goto(`${extensionURL}${URL_ACCOUNT_SELECT}`, { waitUntil: 'load' })

  await page.waitForSelector(SELECTORS.account, { visible: true })

  // Check the details of the added accounts
  await checkAccountDetails(
    page,
    SELECTORS.account,
    [accountName1, accountName2],
    [firstSelectedAccount, secondSelectedAccount]
  )
}

export async function selectHdPathAndAddAccount(
  page,
  hdPathSelector,
  { shouldSaveSeed = false } = {}
) {
  // Select the HD Path dropdown
  await clickOnElement(page, SELECTORS.selectChangeHdPath, true, 500)
  // Select different HD path
  await clickOnElement(page, hdPathSelector, true, 500)

  // TODO: Investigate and replace with a proper condition instead of using a fixed wait time.
  // Note: The "waitForSelector" is not enough to be sure that the addresses data are fully loaded.
  // At this moment I couldn't find an other solution except to set a timeout
  await wait(2000)

  await page.waitForSelector(SELECTORS.checkbox, { visible: true })

  const accountAddresses = await page.$$eval(SELECTORS.addAccountField, (elements) =>
    elements
      .map((element) => element.innerText)
      .filter((item) => {
        // Regular expression to match a valid Ethereum address
        const validAddressRegex = /^0x[a-fA-F0-9]{40}$/
        return validAddressRegex.test(item)
      })
  )

  // Take the first two accounts from the list
  const [firstAddress] = accountAddresses

  const accAddrSelector = buildSelector(TEST_IDS.addAccount, firstAddress)

  // Click on selected account address button
  await clickOnElement(page, accAddrSelector)

  // Click on "Import account" button
  await clickOnElement(page, `${SELECTORS.buttonImportAccount}:not([disabled])`)
  await page.waitForNavigation()

  await page.waitForSelector(SELECTORS.address, { visible: true })

  const importedAccountDetails = await page.$$eval(SELECTORS.address, (elements) =>
    elements.map((element) => element.innerText)
  )

  // Check if there is an imported account
  expect(importedAccountDetails.length).toBeGreaterThan(0)
  // Check if there is an imported account address is equal to the selected one
  expect(importedAccountDetails[0]).toEqual(firstAddress)

  // Click on "Save and Continue" button
  await clickOnElement(page, SELECTORS.saveAndContinueBtn)

  if (shouldSaveSeed) {
    // Click on "Save" button in "Save the imported seed" page, which saves the seed and redirect to the dashboard
    await clickOnElement(page, SELECTORS.saveAsDefaultSeedBtn)
  }
}

export async function interactWithTrezorConnectPage(trezorConnectPage) {
  // Wait for the device name to be visible and click on it
  const deviceNameSelector = 'button.list .wrapper .device-name'

  await clickOnElement(trezorConnectPage, deviceNameSelector)

  // Wait for the confirm button
  await trezorConnectPage.waitForSelector(SELECTORS.trezorPermissionConfirmButton, {
    visible: true
  })
  // Click on the first button with this selector
  await trezorConnectPage.$$eval(SELECTORS.trezorPermissionConfirmButton, (el) => el[0].click())

  // Wait for the export address confirmation button
  await trezorConnectPage.waitForSelector(SELECTORS.trezorExportAddressConfirmButton, {
    visible: true
  })

  // Click on the first button with this selector
  await trezorConnectPage.$$eval(SELECTORS.trezorExportAddressConfirmButton, (el) => el[0].click())
}
