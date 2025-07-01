import { saParams } from 'constants/env'
import tokens from 'constants/tokens'
import { test } from 'fixtures/pageObjects' // your extended test with authPage

test.describe('swapAndBridgePage Smart Account', () => {
  test.beforeEach(async ({ swapAndBridgePage }) => {
    await swapAndBridgePage.init(saParams)
  })

  test('should accept amount starting with zeros like "00.01" with during Swap & Bridge with a Smart Account', async ({
    swapAndBridgePage
  }) => {
    const fromToken = tokens.dai.optimism
    const toToken = tokens.usdce.optimism
    await swapAndBridgePage.prepareSwapAndBridge(0.1, fromToken, toToken)
    await swapAndBridgePage.enterNumber('00.01', true)
  })

  test('should accept amount starting with point like ".01" during Swap & Bridge with a Smart Account', async ({
    swapAndBridgePage
  }) => {
    const fromToken = tokens.dai.optimism
    const toToken = tokens.usdce.optimism

    await swapAndBridgePage.prepareSwapAndBridge(0.1, fromToken, toToken)
    await swapAndBridgePage.enterNumber('.01', true)
  })

  test('should not accept chars as amount during Swap & Bridge with a Smart Account', async ({
    swapAndBridgePage
  }) => {
    const fromToken = tokens.dai.optimism
    const toToken = tokens.usdce.optimism

    await swapAndBridgePage.prepareSwapAndBridge(0.1, fromToken, toToken)
    await swapAndBridgePage.enterNumber('abc', true)
  })

  test('should switch tokens during Swap & Bridge with a Smart Account', async ({
    swapAndBridgePage
  }) => {
    const fromToken = tokens.usdc.base
    const toToken = tokens.wallet.base

    await swapAndBridgePage.openSwapAndBridge()
    await swapAndBridgePage.prepareSwapAndBridge(null, fromToken, toToken)
    await swapAndBridgePage.switchTokensOnSwapAndBridge()
  })

  test('should do MAX token "From" amount during Swap & Bridge with a Smart Account', async ({
    swapAndBridgePage
  }) => {
    const dai = tokens.dai.optimism
    const usdc = tokens.usdc.base

    await swapAndBridgePage.verifySendMaxTokenAmount(dai)
    await swapAndBridgePage.verifySendMaxTokenAmount(usdc)
  })

  test('should find token that already exists within the "Receive" list during Swap & Bridge with a Smart Account', async ({
    swapAndBridgePage
  }) => {
    const usdc = tokens.usdc.base
    const wallet = tokens.wallet.base
    const link = tokens.link.base

    await swapAndBridgePage.verifyDefaultReceiveToken(usdc, wallet)
    await swapAndBridgePage.verifyDefaultReceiveToken(wallet, link)
  })

  test('should import a token by address that is NOT in the default "Receive" list during Swap & Bridge with a Smart Account', async ({
    swapAndBridgePage
  }) => {
    const eth = tokens.eth.ethereum
    const wcres = tokens.wcres.ethereum
    await swapAndBridgePage.verifyNonDefaultReceiveToken(eth, wcres)
  })

  test('should "reject" (ie cancel) Swap & Bridge from the Pending Route component with a Smart Account', async ({
    swapAndBridgePage
  }) => {
    const usdc = tokens.usdc.base
    const wallet = tokens.wallet.base
    await swapAndBridgePage.openSwapAndBridge()
    await swapAndBridgePage.prepareSwapAndBridge(0.8, usdc, wallet)
    await swapAndBridgePage.rejectTransaction()
  })

  test('should "proceed" Swap & Bridge from the Pending Route component with a Smart Account', async ({
    swapAndBridgePage
  }) => {
    const usdc = tokens.usdc.base
    const wallet = tokens.wallet.base

    await swapAndBridgePage.openSwapAndBridge()
    await swapAndBridgePage.prepareSwapAndBridge(0.005, usdc, wallet)
    await swapAndBridgePage.proceedTransaction()
  })

  test('should switch from token amount to USD value and vise-versa during Swap & Bridge with a Smart Account', async ({
    swapAndBridgePage
  }) => {
    const usdce = tokens.usdce.optimism
    const dai = tokens.dai.optimism
    const usdc = tokens.usdc.base
    const xwallet = tokens.xwallet.ethereum

    await swapAndBridgePage.switchUSDValueOnSwapAndBridge(usdce, 0.34)
    await swapAndBridgePage.switchUSDValueOnSwapAndBridge(dai, 0.2)
    await swapAndBridgePage.switchUSDValueOnSwapAndBridge(usdc, 0.012)
    await swapAndBridgePage.switchUSDValueOnSwapAndBridge(xwallet, 1)
    await swapAndBridgePage.switchUSDValueOnSwapAndBridge(dai, 0.51)
    await swapAndBridgePage.switchUSDValueOnSwapAndBridge(xwallet, 0.9)
  })

  test('should auto-refresh active route after 60s during Swap & Bridge with a Smart Account', async ({
    swapAndBridgePage
  }) => {
    const usdc = tokens.usdc.base
    const wallet = tokens.wallet.base

    await swapAndBridgePage.prepareSwapAndBridge(0.009, usdc, wallet)
    await swapAndBridgePage.verifyAutoRefreshRoute()
  })

  test('should select a different route when Swap & Bridge with a Smart Account', async ({
    swapAndBridgePage
  }) => {
    const usdc = tokens.usdc.base
    const wallet = tokens.wallet.base

    await swapAndBridgePage.prepareSwapAndBridge(0.009, usdc, wallet)
    await swapAndBridgePage.clickOnSecondRoute()
  })

  test('should Bridge tokens with a Smart Account', async ({ swapAndBridgePage }) => {
    const usdc = tokens.usdc.base
    const usdcOpt = tokens.usdc.optimism
    await swapAndBridgePage.prepareBridgeTransaction(0.0063, usdc, usdcOpt)
    await swapAndBridgePage.signTokens()
  })

  test('should batch Swap of ERC20 tokens and Native to ERC20 token with a Smart Account', async ({
    swapAndBridgePage
  }) => {
    const usdc = tokens.usdc.base
    const wallet = tokens.wallet.base
    const eth = tokens.eth.base

    await swapAndBridgePage.prepareSwapAndBridge(0.003, wallet, usdc)
    await swapAndBridgePage.batchAction()
    await swapAndBridgePage.prepareSwapAndBridge(0.002, usdc, eth)
    await swapAndBridgePage.batchActionWithSign()
  })
})
