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
  // These are pure UI/UX checks that don't submit a transaction. Each page-object method below
  // self-resets the form via openSwapAndBridge() (which reloads when already on the page), so they
  // can safely share a single extension instance and run as sub-steps of one test instead of
  // bootstrapping a fresh isolated environment for every assertion.
  test('Swap & Bridge UI/UX checks with a Smart Account', async ({ pages }) => {
    test.setTimeout(180000)

    await test.step('should switch from token amount to USD value and vise-versa', async () => {
      await pages.swapAndBridge.switchUSDValueOnSwapAndBridge(tokens.dai.optimism, 0.2)
      await pages.swapAndBridge.switchUSDValueOnSwapAndBridge(tokens.usdc.base, 0.2)
    })

    await test.step('should switch tokens', async () => {
      await pages.swapAndBridge.openSwapAndBridge()
      await pages.swapAndBridge.prepareSwapAndBridge(null, tokens.usdc.base, tokens.wallet.base)
      await pages.swapAndBridge.switchTokensOnSwapAndBridge()
    })

    await test.step('should do MAX token "From" amount', async () => {
      await pages.swapAndBridge.verifySendMaxTokenAmount(tokens.dai.optimism)
      await pages.swapAndBridge.verifySendMaxTokenAmount(tokens.usdc.base)
    })

    await test.step('should find token that already exists within the "Receive" list', async () => {
      await pages.swapAndBridge.verifyDefaultReceiveToken(tokens.usdc.base, tokens.wallet.base)
      await pages.swapAndBridge.verifyDefaultReceiveToken(tokens.eth.base, tokens.wallet.base)
    })

    await test.step('import a token by address that is NOT in the default "Receive" list returns error', async () => {
      await pages.swapAndBridge.verifyNonDefaultReceiveToken(
        tokens.eth.ethereum,
        tokens.wcres.ethereum
      )
    })

    await test.step('should accept amount starting with zeros like "00.01"', async () => {
      await pages.swapAndBridge.prepareSwapAndBridge(0.1, tokens.dai.optimism, tokens.usdc.optimism)
      await pages.swapAndBridge.enterNumber('00.01', true)
    })

    await test.step('should accept amount starting with point like ".01"', async () => {
      await pages.swapAndBridge.prepareSwapAndBridge(0.1, tokens.dai.optimism, tokens.usdc.optimism)
      await pages.swapAndBridge.enterNumber('.01', true)
    })

    await test.step('should not accept chars as amount', async () => {
      await pages.swapAndBridge.prepareSwapAndBridge(0.1, tokens.dai.optimism, tokens.usdc.optimism) // ~ 0.1$
      await pages.swapAndBridge.enterNumber('abc', true)
    })
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
    test.setTimeout(60000)
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
