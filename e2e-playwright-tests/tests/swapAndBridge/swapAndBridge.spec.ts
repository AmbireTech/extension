import { saParams } from 'constants/env'
import tokens from 'constants/tokens'
import { test } from 'fixtures/pageObjects'
import { runSwapBatchFlow, runSwapFlow, runSwapProceedFlow } from 'flows/swapAndBridgeFlow'

test.describe('swapAndBridge Smart Account', { tag: '@swapAndBridge' }, () => {
  test.beforeEach(async ({ pages }) => {
    await pages.initWithStorage(saParams)
  })

  test.afterEach(async ({ context }) => {
    await context.close()
  })
  test('should accept amount starting with zeros like "00.01" with during Swap & Bridge with a Smart Account', async ({
    pages
  }) => {
    const fromToken = tokens.dai.optimism
    const toToken = tokens.usdc.optimism
    await pages.swapAndBridge.prepareSwapAndBridge(0.1, fromToken, toToken)
    await pages.swapAndBridge.enterNumber('00.01', true)
  })

  test('should accept amount starting with point like ".01" during Swap & Bridge with a Smart Account', async ({
    pages
  }) => {
    const fromToken = tokens.dai.optimism
    const toToken = tokens.usdc.optimism

    await pages.swapAndBridge.prepareSwapAndBridge(0.1, fromToken, toToken)
    await pages.swapAndBridge.enterNumber('.01', true)
  })

  test('should not accept chars as amount during Swap & Bridge with a Smart Account', async ({
    pages
  }) => {
    const fromToken = tokens.dai.optimism
    const toToken = tokens.usdc.optimism

    await pages.swapAndBridge.prepareSwapAndBridge(0.1, fromToken, toToken) // ~ 0.1$
    await pages.swapAndBridge.enterNumber('abc', true)
  })

  test('should switch tokens during Swap & Bridge with a Smart Account', async ({ pages }) => {
    const fromToken = tokens.usdc.base
    const toToken = tokens.wallet.base

    await pages.swapAndBridge.openSwapAndBridge()
    await pages.swapAndBridge.prepareSwapAndBridge(null, fromToken, toToken)
    await pages.swapAndBridge.switchTokensOnSwapAndBridge()
  })

  test('should do MAX token "From" amount during Swap & Bridge with a Smart Account', async ({
    pages
  }) => {
    const dai = tokens.dai.optimism
    const usdc = tokens.usdc.base

    await pages.swapAndBridge.verifySendMaxTokenAmount(dai)
    await pages.swapAndBridge.verifySendMaxTokenAmount(usdc)
  })

  test('should find token that already exists within the "Receive" list during Swap & Bridge with a Smart Account', async ({
    pages
  }) => {
    const usdc = tokens.usdc.base
    const wallet = tokens.wallet.base
    const eth = tokens.eth.base

    await pages.swapAndBridge.verifyDefaultReceiveToken(usdc, wallet)
    await pages.swapAndBridge.verifyDefaultReceiveToken(eth, wallet)
  })

  test('should import a token by address that is NOT in the default "Receive" list during Swap & Bridge with a Smart Account', async ({
    pages
  }) => {
    const eth = tokens.eth.ethereum
    const wcres = tokens.wcres.ethereum
    await pages.swapAndBridge.verifyNonDefaultReceiveToken(eth, wcres)
  })

  test('should "reject" (ie cancel) Swap & Bridge from the Pending Route component with a Smart Account', async ({
    pages
  }) => {
    const usdc = tokens.usdc.base
    const wallet = tokens.wallet.base
    await pages.swapAndBridge.openSwapAndBridge()
    await pages.swapAndBridge.prepareSwapAndBridge(1, usdc, wallet) // ~ 0,1$
    await pages.swapAndBridge.rejectTransaction()
  })

  test('should switch from token amount to USD value and vise-versa during Swap & Bridge with a Smart Account', async ({
    pages
  }) => {
    const dai = tokens.dai.optimism
    const usdc = tokens.usdc.base

    await pages.swapAndBridge.switchUSDValueOnSwapAndBridge(dai, 0.2)
    await pages.swapAndBridge.switchUSDValueOnSwapAndBridge(usdc, 0.2)
  })

  test('should auto-refresh active route after 60s during Swap & Bridge with a Smart Account', async ({
    pages
  }) => {
    const usdc = tokens.usdc.base
    const wallet = tokens.wallet.base

    await pages.swapAndBridge.prepareSwapAndBridge(0.1, usdc, wallet) // ~ 0.1$
    await pages.swapAndBridge.verifyAutoRefreshRoute()
  })

  test('should select a different route when Swap & Bridge with a Smart Account', async ({
    pages
  }) => {
    const usdc = tokens.usdc.base
    const wallet = tokens.wallet.base

    await pages.swapAndBridge.prepareSwapAndBridge(0.01, usdc, wallet) // ~ 0.1$
    await pages.swapAndBridge.clickOnSecondRoute()
  })

  test('should "proceed" Swap & Bridge from the Pending Route component with a Smart Account', async ({
    pages
  }) => {
    await runSwapProceedFlow({
      pages,
      fromToken: tokens.usdc.base,
      toToken: tokens.wallet.base,
      sendAmount: 0.01,
      assertNoInitialTx: true
    })
  })

  test('should Bridge tokens with a Smart Account', async ({ pages }) => {
    await runSwapFlow({
      pages,
      sendToken: tokens.usdc.base,
      receiveToken: tokens.usdc.optimism,
      bridgeAmount: 0.01,
      assertNoInitialTx: true
    })
  })

  test('should batch Swap of ERC20 tokens and Native to ERC20 token with a Smart Account', async ({
    pages
  }) => {
    await runSwapBatchFlow({
      pages,
      swapAmount: 0.01,
      fromToken: tokens.usdc.base,
      toToken: tokens.wallet.base
    })
  })
})
