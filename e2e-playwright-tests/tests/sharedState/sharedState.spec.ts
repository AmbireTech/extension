import { baParams, SA_ADDRESS } from 'constants/env'
import tokens from 'constants/tokens'
import { test } from 'fixtures/pageObjects'
import { runSimpleTransferFlow, runBatchTransferFlow } from '../../flows/transferFlow'
import { PageManager } from '../../pages/utils/page_instances'
import { runSwapBatchFlow, runSwapFlow, runSwapProceedFlow } from '../../flows/swapAndBridgeFlow'
import { runAddManualNetworkFlow, runChainlistFlow } from '../../flows/networkManagementFlow'

test.describe.configure({ mode: 'serial' })

let sharedPages: PageManager

test.describe('sharedState', { tag: '@sharedState' }, () => {
  test.beforeAll(async ({ pages }) => {
    await pages.initWithStorage(baParams)
    sharedPages = pages
  })

  test.beforeEach(async () => {
    await sharedPages.dashboard.navigateToDashboard()
  })

  test.afterEach(async ({ context }) => {
    await context.close()
  })

  test.describe('Transfer', () => {
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
    test('adding network manually', async () => {
      await runAddManualNetworkFlow({ pages: sharedPages })
    })

    test('add, edit and disable network from Chainlist', async () => {
      await runChainlistFlow({ pages: sharedPages })
    })
  })

  test.describe('Keystore', () => {
    test('should lock keystore', async () => {
      await sharedPages.settings.lockKeystore()
    })

    test('should unlock keystore', async () => {
      await sharedPages.settings.unlockKeystore()
    })
  })

  test.describe('Swap & Bridge', () => {
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
