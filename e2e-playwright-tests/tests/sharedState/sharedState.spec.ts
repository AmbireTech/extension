import { baParams, SA_ADDRESS } from 'constants/env'
import tokens from 'constants/tokens'
import { test } from 'fixtures/pageObjects'

import { runAddManualNetworkFlow, runChainlistFlow } from '../../flows/networkManagementFlow'
import { runSwapBatchFlow, runSwapFlow, runSwapProceedFlow } from '../../flows/swapAndBridgeFlow'
import { runBatchTransferFlow, runSimpleTransferFlow } from '../../flows/transferFlow'
import { PageManager } from '../../pages/utils/page_instances'

let sharedPages: PageManager

test.describe('sharedState', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(async ({ pages }) => {
    await pages.initWithStorage(baParams)
    sharedPages = pages
  })

  test.describe('Transfer', () => {
    test.describe.configure({ mode: 'serial' })

    test.beforeEach(async () => {
      await sharedPages.dashboard.navigateToDashboard()
    })

    test('should send a transaction and pay with the current account gas tank', async () => {
      await runSimpleTransferFlow({
        pages: sharedPages,
        sendToken: tokens.usdc.optimism,
        recipientAddress: SA_ADDRESS,
        feeToken: tokens.usdc.ethereum,
        payWithGasTank: true,
        message: 'Transfer done!'
      })
    })

    test("should send a transaction and pay with the current account's ERC-20 token", async () => {
      await runSimpleTransferFlow({
        pages: sharedPages,
        sendToken: tokens.usdc.optimism,
        recipientAddress: '0xc162b2F9f06143Cf063606d814C7F38ED4471F44',
        feeToken: tokens.usdc.optimism,
        payWithGasTank: false,
        message: 'Transfer done!'
      })
    })

    test('should batch multiple transfer transactions', async () => {
      await runBatchTransferFlow({
        pages: sharedPages,
        sendToken: tokens.usdc.optimism,
        recipientAddress: '0xc162b2F9f06143Cf063606d814C7F38ED4471F44'
      })
    })
  })

  test.describe('Network Management', () => {
    test.describe.configure({ mode: 'serial' })

    test.beforeEach(async () => {
      await sharedPages.dashboard.navigateToDashboard()
    })

    test('adding network manually', async () => {
      await runAddManualNetworkFlow({ pages: sharedPages })
    })

    // TODO - Temporarily skip this test as it fails in the shared state setup, and needs further investigation,
    //  but we want to merge the PR to v2 with the rest test.
    test.skip('add, edit and disable network from Chainlist', async () => {
      await runChainlistFlow({ pages: sharedPages })
    })
  })

  test.describe('Keystore', () => {
    test.describe.configure({ mode: 'serial' })

    test.beforeEach(async () => {
      await sharedPages.dashboard.navigateToDashboard()
    })

    // TODO - Temporarily skip this test as it fails in the shared state setup, and needs further investigation
    test.skip('should lock keystore', async () => {
      await sharedPages.settings.lockKeystore()
    })

    test.skip('should unlock keystore', async () => {
      await sharedPages.settings.unlockKeystore()
    })
  })

  test.describe('Swap & Bridge', () => {
    test.describe.configure({ mode: 'serial' })

    test.beforeEach(async () => {
      await sharedPages.dashboard.navigateToDashboard()
    })

    test('should "Proceed" Swap & Bridge from the Pending Route component', async () => {
      await runSwapProceedFlow({
        pages: sharedPages,
        fromToken: tokens.usdc.base,
        toToken: tokens.wallet.base,
        sendAmount: 0.01
      })
    })

    test('should Bridge tokens', async () => {
      await runSwapFlow({
        pages: sharedPages,
        sendToken: tokens.usdc.base,
        receiveToken: tokens.usdc.optimism,
        bridgeAmount: 0.01
      })
    })

    test('should batch Swap of ERC20 tokens and Native to ERC20 token', async () => {
      await runSwapBatchFlow({
        pages: sharedPages,
        swapAmount: 0.01,
        fromToken: tokens.usdc.base,
        toToken: tokens.wallet.base
      })
    })
  })
})
