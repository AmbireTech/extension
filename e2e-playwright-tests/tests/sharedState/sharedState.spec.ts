import { baParams, SA_ADDRESS } from 'constants/env'
import tokens from 'constants/tokens'
import { test } from 'fixtures/pageObjects'
import { runSimpleTransferFlow, runBatchTransferFlow } from '../../flows/transferFlow'
import { PageManager } from '../../pages/utils/page_instances'

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
