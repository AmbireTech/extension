import { KEYSTORE_PASS, ledgerBaParams, ledgerSaParams, SA_ADDRESS } from 'constants/env'
import mainConstants from 'constants/mainConstants'
import selectors from 'constants/selectors'
import tokens from 'constants/tokens'
import { test } from 'fixtures/pageObjects' // your extended test with auth
import { runSwapFlow, runSwapProceedFlow } from 'flows/swapAndBridgeFlow'
import { runBatchTransferFlow, runSimpleTransferFlow } from 'flows/transferFlow'

import { expect } from '@playwright/test'

import { SpeculosDevice } from '../../libs/speculos-device/device'

const LEDGER_EMULATOR_HTTP_URL = process.env.LEDGER_EMULATOR_HTTP_URL
// test.describe.configure({ mode: 'serial' })

test.describe('ledger', { tag: '@ledgerTests' }, () => {
  test.setTimeout(600000)

  test.afterEach(async ({ context }) => {
    await context.close()
  })

  // Without storage tests
  test('ledger without storage - import account', async ({ pages }) => {
    await test.step('init without storage', async () => {
      await pages.initWithoutStorage()
    })

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

  // Basic Account with storage tests
  test('ledger BA - should have balance on the dashboard', async ({ pages }) => {
    await test.step('init BA storage', async () => {
      await pages.initWithStorage(ledgerBaParams)
    })

    await test.step('check balance in account', async () => {
      await pages.dashboard.checkBalanceInAccount()
    })
  })

  test('ledger BA - sign message', async ({ pages }) => {
    await test.step('init BA storage', async () => {
      await pages.initWithStorage(ledgerBaParams)
    })

    await test.step('sign message', async () => {
      const ledgerSimulatorControls = new SpeculosDevice({ baseUrl: LEDGER_EMULATOR_HTTP_URL })
      const message = 'Hello, Ambire!'

      await pages.signMessage.signMessage(message, 'plain', ledgerSimulatorControls)
    })
  })

  test('ledger BA - send transaction with native token', async ({ pages }) => {
    await test.step('init BA storage', async () => {
      await pages.initWithStorage(ledgerBaParams)
    })

    await test.step('send transaction and pay with native token', async () => {
      const ledgerSimulatorControls = new SpeculosDevice({ baseUrl: LEDGER_EMULATOR_HTTP_URL })

      // Enable blind signing in Ledger settings, otherwise the transaction won't be signed
      // It should only once for all tests, but enabling it in each test
      // to make sure it's enabled when running tests separately with test.only
      await ledgerSimulatorControls.enableBlindSigning()

      const sendToken = tokens.usdc.optimism
      const feeToken = tokens.eth.optimism
      const recipientAddress = SA_ADDRESS
      const message = 'Transfer done!'

      await runSimpleTransferFlow({
        pages,
        sendToken,
        recipientAddress,
        feeToken,
        payWithGasTank: false,
        message,
        assertNoInitialTx: true,
        ledgerSimulatorControls
      })
    })
  })

  // Smart Account with storage tests
  test('ledger SA - top up Gas Tank with 0.01$ on Base', async ({ pages }) => {
    await test.step('init SA storage', async () => {
      await pages.initWithStorage(ledgerSaParams)
    })

    await test.step('top up gas tank', async () => {
      const ledgerSimulatorControls = new SpeculosDevice({
        baseUrl: LEDGER_EMULATOR_HTTP_URL
      })

      // It should be enabled only when running the exact test with (test.only) locally,
      // Otherwise, the simulator will not be able to sign blind transactions.
      await ledgerSimulatorControls.enableBlindSigning()

      const sendToken = tokens.usdc.base
      const message = 'Top up ready!'
      const topUpAmount = '0.01'

      await pages.gasTank.topUpGasTank(sendToken, topUpAmount)

      await pages.transfer.signSlowSpeedTransaction({
        sendToken,
        message,
        ledgerSimulatorControls
      })
    })

    await test.step('assert transaction visible', async () => {
      await pages.gasTank.checkSendTransactionOnActivityTab()
    })
  })

  test('ledger SA - should batch multiple transfer transactions', async ({ pages }) => {
    await test.step('init SA storage', async () => {
      await pages.initWithStorage(ledgerSaParams)
    })

    await test.step('batch multiple transfer transactions', async () => {
      const ledgerSimulatorControls = new SpeculosDevice({
        baseUrl: LEDGER_EMULATOR_HTTP_URL
      })

      // It should be enabled only when running the exact test with (test.only) locally,
      // Otherwise, the simulator will not be able to sign blind transactions.
      await ledgerSimulatorControls.enableBlindSigning()

      const sendToken = tokens.usdc.base
      const recipientAddress = SA_ADDRESS

      await runBatchTransferFlow({
        pages,
        sendToken,
        recipientAddress,
        ledgerSimulatorControls
      })
    })
  })

  test('ledger SA - should "proceed" Swap from the Pending Route component with a Smart Account', async ({
    pages
  }) => {
    await test.step('init SA storage', async () => {
      await pages.initWithStorage(ledgerSaParams)
    })

    await test.step('proceed Swap from the Pending Route component with a Smart Account', async () => {
      const ledgerSimulatorControls = new SpeculosDevice({
        baseUrl: LEDGER_EMULATOR_HTTP_URL
      })

      // It should be enabled only when running the exact test with (test.only) locally,
      // Otherwise, the simulator will not be able to sign blind transactions.
      await ledgerSimulatorControls.enableBlindSigning()

      const fromToken = tokens.usdc.base
      const toToken = tokens.wallet.base
      const sendAmount = 0.01

      await runSwapProceedFlow({
        pages,
        fromToken,
        toToken,
        sendAmount,
        assertNoInitialTx: true,
        ledgerSimulatorControls
      })
    })
  })

  test('ledger SA - should "proceed" Bridge from the Pending Route component with a Smart Account', async ({
    pages
  }) => {
    await test.step('init SA storage', async () => {
      await pages.initWithStorage(ledgerSaParams)
    })

    await test.step('proceed Bridge from the Pending Route component with a Smart Account', async () => {
      const ledgerSimulatorControls = new SpeculosDevice({
        baseUrl: LEDGER_EMULATOR_HTTP_URL
      })

      // It should be enabled only when running the exact test with (test.only) locally,
      // Otherwise, the simulator will not be able to sign blind transactions.
      await ledgerSimulatorControls.enableBlindSigning()

      const sendToken = tokens.usdc.base
      const receiveToken = tokens.usdc.optimism
      const bridgeAmount = 0.01

      await runSwapFlow({
        pages,
        sendToken,
        receiveToken,
        bridgeAmount,
        assertNoInitialTx: true,
        ledgerSimulatorControls
      })
    })
  })
})
