import { test, expect } from '@playwright/test'
import type Token from 'interfaces/token'
import type { PageManager } from 'pages/utils/page_instances'

export async function runSwapFlow({
  pages,
  sendToken,
  receiveToken,
  bridgeAmount,
  message = 'Nice trade!',
  assertNoInitialTx = false
}: {
  pages: PageManager
  sendToken: Token
  receiveToken: Token
  bridgeAmount: number
  message?: string
  assertNoInitialTx?: boolean
}) {
  if (assertNoInitialTx) {
    await test.step('assert no transaction on Activity tab', async () => {
      await pages.dashboard.checkNoTransactionOnActivityTab()
    })
  }

  await test.step('prepare bridge transaction', async () => {
    await pages.swapAndBridge.prepareBridgeTransaction(bridgeAmount, sendToken, receiveToken)
  })

  await test.step('sign transaction', async () => {
    await pages.transfer.signSlowSpeedTransaction({
      sendToken,
      message
    })
  })

  await test.step('assert new transaction on Activity tab', async () => {
    await pages.swapAndBridge.checkSendTransactionOnActivityTab()
  })
}

export async function runSwapBatchFlow({
  pages,
  swapAmount,
  fromToken,
  toToken
}: {
  pages: PageManager
  swapAmount: number
  fromToken: Token
  toToken: Token
}) {
  await test.step('start monitoring requests', async () => {
    await pages.swapAndBridge.monitorRequests()
  })

  await test.step('add first swap to batch', async () => {
    await pages.swapAndBridge.prepareSwapAndBridge(swapAmount, fromToken, toToken)
    await pages.swapAndBridge.batchAction()
  })

  await test.step('add second swap + sign', async () => {
    await pages.swapAndBridge.prepareSwapAndBridge(swapAmount, fromToken, toToken)
    await pages.swapAndBridge.batchActionWithSign()
  })

  await test.step('stop monitoring requests and expect no uncategorized requests', async () => {
    const { uncategorized } = pages.swapAndBridge.getCategorizedRequests()
    pages.swapAndBridge.stopMonitorRequests()
    expect(uncategorized.length).toBeLessThanOrEqual(0)
  })
}

export async function runSwapProceedFlow({
  pages,
  fromToken,
  toToken,
  sendAmount,
  assertNoInitialTx = false
}: {
  pages: PageManager
  fromToken: Token
  toToken: Token
  sendAmount: number
  assertNoInitialTx?: boolean
}) {
  if (assertNoInitialTx) {
    await test.step('assert no transaction on Activity tab', async () => {
      await pages.dashboard.checkNoTransactionOnActivityTab()
    })
  }

  await test.step('prepare swap & bridge route', async () => {
    await pages.swapAndBridge.openSwapAndBridge()
    await pages.swapAndBridge.prepareSwapAndBridge(sendAmount, fromToken, toToken)
  })

  await test.step('proceed and sign transaction', async () => {
    await pages.swapAndBridge.proceedTransaction()
  })

  await test.step('assert new transaction on Activity tab', async () => {
    await pages.swapAndBridge.checkSendTransactionOnActivityTab()
  })
}
