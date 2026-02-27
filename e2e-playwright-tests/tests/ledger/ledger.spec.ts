import { KEYSTORE_PASS, ledgerParams, ledgerSaParams, SA_ADDRESS } from 'constants/env'
import mainConstants from 'constants/mainConstants'
import selectors from 'constants/selectors'
import tokens from 'constants/tokens'
import { test } from 'fixtures/pageObjects' // your extended test with auth
import { runSwapFlow, runSwapProceedFlow } from 'flows/swapAndBridgeFlow'
import { runBatchTransferFlow, runSimpleTransferFlow } from 'flows/transferFlow'

import { expect } from '@playwright/test'

import { SpeculosDevice } from '../../libs/speculos-device/device'

const LEDGER_EMULATOR_HTTP_URL = process.env.LEDGER_EMULATOR_HTTP_URL

test.describe.configure({ mode: 'serial' })

test.describe('ledger without storage', () => {
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
  test.beforeEach(async ({ pages }) => {
    await pages.initWithStorage(ledgerParams)
  })

  test.afterEach(async ({ context }) => {
    await context.close()
  })

  test('should have balance on the dashboard', async ({ pages }) => {
    await pages.dashboard.checkBalanceInAccount()
  })

  test('should sign plain message', async ({ pages }) => {
    const ledgerSimulatorControls = new SpeculosDevice({ baseUrl: LEDGER_EMULATOR_HTTP_URL })
    const message = 'Hello, Ambire!'

    await pages.signMessage.signMessage(message, 'plain', ledgerSimulatorControls)
  })

  test('should send a transaction and pay with native token', async ({ pages }) => {
    const ledgerSimulatorControls = new SpeculosDevice({ baseUrl: LEDGER_EMULATOR_HTTP_URL })

    // Enable blind signing in Ledger settings, otherwise the transaction won't be signed
    await ledgerSimulatorControls.enableBlindSigning()

    await runSimpleTransferFlow({
      pages,
      sendToken: tokens.usdc.optimism,
      recipientAddress: SA_ADDRESS,
      feeToken: tokens.eth.optimism,
      payWithGasTank: false,
      message: 'Transfer done!',
      assertNoInitialTx: true,
      ledgerSimulatorControls
    })
  })
})

test.describe('ledger SA with storage', () => {
  test.beforeEach(async ({ pages }) => {
    await pages.initWithStorage(ledgerSaParams)
  })

  test.afterEach(async ({ context }) => {
    await context.close()
  })

  test('should batch multiple transfer transactions', async ({ pages }) => {
    const ledgerSimulatorControls = new SpeculosDevice({ baseUrl: LEDGER_EMULATOR_HTTP_URL })
    // It should be enabled only when running the exact test with (test.only) locally,
    // Otherwise, the simulator will not be able to sign blind transactions.
    // await ledgerSimulatorControls.enableBlindSigning()

    await runBatchTransferFlow({
      pages,
      sendToken: tokens.usdc.base,
      recipientAddress: SA_ADDRESS,
      ledgerSimulatorControls
    })
  })

  test('should "proceed" Swap from the Pending Route component with a Smart Account', async ({
    pages
  }) => {
    const ledgerSimulatorControls = new SpeculosDevice({ baseUrl: LEDGER_EMULATOR_HTTP_URL })
    // It should be enabled only when running the exact test with (test.only) locally,
    // Otherwise, the simulator will not be able to sign blind transactions.
    // await ledgerSimulatorControls.enableBlindSigning()

    await runSwapProceedFlow({
      pages,
      fromToken: tokens.usdc.base,
      toToken: tokens.wallet.base,
      sendAmount: 0.01,
      assertNoInitialTx: true,
      ledgerSimulatorControls
    })
  })

  test('should "proceed" Bridge from the Pending Route component with a Smart Account', async ({
    pages
  }) => {
    const ledgerSimulatorControls = new SpeculosDevice({ baseUrl: LEDGER_EMULATOR_HTTP_URL })
    // It should be enabled only when running the exact test with (test.only) locally,
    // Otherwise, the simulator will not be able to sign blind transactions.
    // await ledgerSimulatorControls.enableBlindSigning()

    await runSwapFlow({
      pages,
      sendToken: tokens.usdc.base,
      receiveToken: tokens.usdc.optimism,
      bridgeAmount: 0.01,
      assertNoInitialTx: true,
      ledgerSimulatorControls
    })
  })

  test('top up Gas Tank with 0.1$ on Base', async ({ pages }) => {
    const ledgerSimulatorControls = new SpeculosDevice({ baseUrl: LEDGER_EMULATOR_HTTP_URL })
    // It should be enabled only when running the exact test with (test.only) locally,
    // Otherwise, the simulator will not be able to sign blind transactions.
    // await ledgerSimulatorControls.enableBlindSigning()

    const sendToken = tokens.usdc.base
    const message = 'Top up ready!'

    await test.step('assert no transaction on Activity tab', async () => {
      await pages.dashboard.checkNoTransactionOnActivityTab()
    })

    await test.step('top up gas tank', async () => {
      await pages.gasTank.topUpGasTank(sendToken, '0.01')
      await pages.transfer.signSlowSpeedTransaction({
        sendToken,
        message,
        ledgerSimulatorControls
      })
    })

    await test.step('assert new transaction on Activity tab', async () => {
      await pages.gasTank.checkSendTransactionOnActivityTab()
    })
  })
})
