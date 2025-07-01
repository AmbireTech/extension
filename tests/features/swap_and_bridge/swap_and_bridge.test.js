/* eslint-disable no-await-in-loop */
import { baParams, saParams } from '../../config/constants'
import { bootstrapWithStorage } from '../../common-helpers/bootstrapWithStorage'

import {
  selectButton,
  openSwapAndBridge,
  enterNumber,
  prepareSwapAndBridge,
  batchActionPage,
  signActionPage,
  selectbannerButton,
  verifyIfSwitchIsActive,
  switchTokensOnSwapAndBridge,
  switchUSDValueOnSwapAndBridge,
  prepareBridgeTransaction,
  clickOnSecondRoute,
  changeRoutePriority,
  verifySendMaxTokenAmount,
  verifyNonDefaultReceiveToken,
  verifyDefaultReceiveToken,
  verifyAutoRefreshRoute,
  selectFirstButton
} from './functions'

describe('Swap & Bridge transactions with a Basic Account', () => {
  let browser
  let page
  let recorder

  beforeEach(async () => {
    ;({ browser, page, recorder } = await bootstrapWithStorage('swapAndBridgeBA', baParams))
  })

  afterEach(async () => {
    await recorder.stop()
    await browser.close()
  })

  afterAll(async () => {})

  it('should Swap ERC20 tokens USDC to WALLET on Base network with a Basic Account', async () => {
    await prepareSwapAndBridge(page, 0.009, 'USDC', '8453', 'WALLET')
    await selectButton(page)
    await signActionPage(page)
  })
})

describe('Swap & Bridge transactions with a Smart Account', () => {
  let browser
  let page
  let recorder

  beforeEach(async () => {
    ;({ browser, page, recorder } = await bootstrapWithStorage('swapAndBridgeSA', saParams))
  })

  afterEach(async () => {
    await recorder.stop()
    await browser.close()
  })

  afterAll(async () => {})

  it('should batch Swap of ERC20 tokens and Native to ERC20 token with a Smart Account', async () => {
    await prepareSwapAndBridge(page, 0.003, 'WALLET', '8453', 'USDC')
    await batchActionPage(page)
    await prepareSwapAndBridge(page, 0.002, 'USDC', '8453', 'ETH')
    await selectbannerButton(page)
  })

  it('should accept amount starting with zeros like "00.01" with during Swap & Bridge with a Smart Account', async () => {
    await prepareSwapAndBridge(page, 0.1, 'DAI', '10', 'USDC.E')
    await enterNumber(page, '00.01', true)
  })

  it('should accept amount starting with point like ".01" during Swap & Bridge with a Smart Account', async () => {
    await prepareSwapAndBridge(page, 0.1, 'DAI', '10', 'USDC.E')
    await enterNumber(page, '.01', true)
  })

  it('should not accept chars as amount during Swap & Bridge with a Smart Account', async () => {
    await prepareSwapAndBridge(page, 0.1, 'DAI', '10', 'USDC.E')
    await enterNumber(page, 'abc', true)
  })

  it('should Bridge tokens with a Smart Account', async () => {
    await prepareBridgeTransaction(page, '0.0063', 'USDC', '8453', '10')
    await selectButton(page)
    await signActionPage(page)
  })

  it.skip('should "proceed" Swap & Bridge from the Pending Route component with a Smart Account', async () => {
    // ToDo: rewrite this particular test in playwright due to changes of new version
    await prepareSwapAndBridge(page, 0.01, 'USDC.E', '10', 'DAI')
    await selectButton(page)
    await signActionPage(page)
    await expect(page).toMatchElement('div', { text: 'Pending Route', timeout: 3000 })
    await selectButton(page)
    await signActionPage(page)
    await expect(page).toMatchElement('div', { text: 'Pending Route', timeout: 3000 })
  })

  it.skip('should "reject" (ie cancel) Swap & Bridge from the Pending Route component with a Smart Account', async () => {
    // ToDo: rewrite this particular test in playwright due to changes of new version
    await prepareSwapAndBridge(page, 0.008, 'USDC', '8453', 'WALLET')
    await selectButton(page)
    await signActionPage(page)
    await expect(page).toMatchElement('div', { text: 'Pending Route', timeout: 1000 })
    await selectFirstButton(page, 'Cancel')
    await expect(page).not.toMatchElement('div', { text: 'Pending Route', timeout: 1000 })
  })

  it.skip('should select a different route when Swap & Bridge with a Smart Account', async () => {
    await prepareSwapAndBridge(page, 0.009, 'USDC', '8453', 'WALLET')
    // ToDo: rewrite this particular test in playwright due to changes of new version
    await clickOnSecondRoute(page)
  })

  it('should auto-refresh active route on 60s during Swap & Bridge with a Smart Account', async () => {
    // ToDo: Read the duration and check refresh after duration
    await prepareSwapAndBridge(page, 0.009, 'USDC', '8453', 'WALLET')
    await verifyAutoRefreshRoute(page)
  })

  it('should switch tokens during Swap & Bridge with a Smart Account', async () => {
    await openSwapAndBridge(page)
    await verifyIfSwitchIsActive(page, false)
    await prepareSwapAndBridge(page, null, 'USDC', '8453', 'WALLET')
    await verifyIfSwitchIsActive(page, true)
    await switchTokensOnSwapAndBridge(page)
  })

  it.only('should do MAX token "From" amount during Swap & Bridge with a Smart Account', async () => {
    await verifySendMaxTokenAmount(page, '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1', '10')
    await verifySendMaxTokenAmount(page, '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', '8453')
  })

  it('should switch from token amount to USD value and vise-versa during Swap & Bridge with a Smart Account', async () => {
    await switchUSDValueOnSwapAndBridge(page, 'USDC.E', '10', 0.34)
    await switchUSDValueOnSwapAndBridge(page, 'DAI', '10', 0.2)
    await switchUSDValueOnSwapAndBridge(page, 'USDC', '8453', 0.012)
    await switchUSDValueOnSwapAndBridge(page, 'xWALLET', '1', 1)
    await switchUSDValueOnSwapAndBridge(page, 'DAI', '10', 0.51)
    await switchUSDValueOnSwapAndBridge(page, 'xWALLET', '1', 0.9)
  })

  it('should import a token by address that is NOT in the default "Receive" list during Swap & Bridge with a Smart Account', async () => {
    await verifyNonDefaultReceiveToken(page, 'ETH', '1', 'wCRES')
  })

  it('should find token that already exists within the "Receive" list during Swap & Bridge with a Smart Account', async () => {
    await verifyDefaultReceiveToken(page, 'USDC', '8453', 'WALLET')
    await verifyDefaultReceiveToken(page, 'WALLET', '8453', 'USDC')
  })

  it.skip('should be able to change route priority from highest return to fastest transfer and vise-versa during Swap & Bridge with a Smart Account', async () => {
    // ToDo: rewrite this particular test in playwright due to changes of new version
    // Use Fastest Transfer route
    await changeRoutePriority(page, 'Fastest Transfer')
    await prepareSwapAndBridge(page, 0.1, 'DAI', '10', 'USDC.E')
    await selectButton(page)
    await signActionPage(page)
    await selectFirstButton(page, 'Reject')
    await selectFirstButton(page, 'Back')

    // Use Highest Return route
    await changeRoutePriority(page, 'Highest Return')
    await prepareSwapAndBridge(page, 0.1, 'DAI', '10', 'USDC.E')
    await selectButton(page)
    await signActionPage(page)
    await selectFirstButton(page, 'Reject')
    await selectFirstButton(page, 'Back')
  })
})
