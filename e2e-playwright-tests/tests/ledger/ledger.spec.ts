import { KEYSTORE_PASS, ledgerParams, SA_ADDRESS } from 'constants/env'
import mainConstants from 'constants/mainConstants'
import selectors from 'constants/selectors'
import tokens from 'constants/tokens'
import { test } from 'fixtures/pageObjects' // your extended test with auth
import { runSimpleTransferFlow } from 'flows/transferFlow'

import { expect } from '@playwright/test'

import { SpeculosDevice } from '../../libs/speculos-device/device'

const LEDGER_SIMULATIUON_URL = process.env.SPECULOS_HTTP_URL || 'http://127.0.0.1:5000'

test.describe('ledger without storage', () => {
  test.describe.configure({ mode: 'serial' })
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

    await test.step('import first account', async () => {
      await page.getByTestId(`add-account-${mainConstants.addresses.ledgerAccount1}`).click()
      await page.getByTestId(selectors.getStarted.importAccountButton).click()
      await page.getByTestId(selectors.getStarted.saveAndContinueBtn).click()
    })

    await test.step('make sure account is imported', async () => {
      await pages.auth.goToDashboard()
      await page.getByTestId(selectors.accountSelectBtn).click()

      await expect(page.getByText(mainConstants.addresses.ledgerAccount1)).toBeVisible()
    })
  })
})

test.describe('ledger with storage', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeEach(async ({ pages }) => {
    await pages.initWithStorage(ledgerParams)
  })

  test.afterEach(async ({ context }) => {
    await context.close()
  })

  // DASHBOARD TESTS
  test('should have balance on the dashboard', async ({ pages }) => {
    await pages.dashboard.checkBalanceInAccount()
  })

  // SIGN MESSAGE TESTS
  test('should sign plain message', async ({ pages }) => {
    const ledgerSimulatorControls = new SpeculosDevice({ baseUrl: LEDGER_SIMULATIUON_URL })
    const message = 'Hello, Ambire!'

    await pages.signMessage.signMessage(message, 'plain', ledgerSimulatorControls)
  })

  test.only('should send a transaction and pay with the current account gas tank', async ({
    pages
  }) => {
    await runSimpleTransferFlow({
      pages,
      sendToken: tokens.usdc.optimism,
      recipientAddress: SA_ADDRESS,
      feeToken: tokens.eth.optimism,
      payWithGasTank: false,
      message: 'Transfer done!',
      assertNoInitialTx: true
    })
  })
})
