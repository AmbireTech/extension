import { KEYSTORE_PASS } from 'constants/env'
import mainConstants from 'constants/mainConstants'
import selectors from 'constants/selectors'
import { test } from 'fixtures/pageObjects' // your extended test with auth

import { expect } from '@playwright/test'

test.describe('ledger', () => {
  test.beforeEach(async ({ pages }) => {
    await pages.initWithoutStorage()
  })

  test.afterEach(async ({ context }) => {
    await context.close()
  })

  test('should successfully authenticate using Ledger and import existing accounts', async ({
    pages
  }) => {
    const page = pages.auth.page

    await test.step('start importing existing Ledger accounts in our Onboarding flow', async () => {
      await page.getByTestId(selectors.getStarted.importExistingAccBtn).click()
      await page.getByTestId(selectors.importMethodLedger).click()

      await page.getByTestId(selectors.getStarted.enterPassField).fill(KEYSTORE_PASS)
      await page.getByTestId(selectors.getStarted.repeatPassField).fill(KEYSTORE_PASS)
      await page.getByTestId(selectors.getStarted.createKeystorePassBtn).click()
    })

    await test.step('import first 2 accounts', async () => {
      await page.getByTestId(`add-account-${mainConstants.addresses.ledgerAccount1}`).click()
      await page.getByTestId(`add-account-${mainConstants.addresses.ledgerAccount2}`).click()
      await page.getByTestId(selectors.getStarted.importAccountButton).click()
      await page.getByTestId(selectors.getStarted.saveAndContinueBtn).click()
    })

    await test.step('make sure accounts are imported', async () => {
      await pages.auth.goToDashboard()
      await page.getByTestId(selectors.accountSelectBtn).click()

      await expect(page.getByText(mainConstants.addresses.ledgerAccount1)).toBeVisible()
      await expect(page.getByText(mainConstants.addresses.ledgerAccount2)).toBeVisible()
    })
  })
})
