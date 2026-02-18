import { test, expect, Page } from '@playwright/test'
import selectors from 'constants/selectors'
import type Token from 'interfaces/token'
import type { PageManager } from 'pages/utils/page_instances'

export async function runSimpleTransferFlow({
  pages,
  sendToken,
  recipientAddress,
  feeToken,
  payWithGasTank,
  message,
  assertNoInitialTx = false
}: {
  pages: PageManager
  sendToken: Token
  recipientAddress: string
  feeToken: Token
  payWithGasTank: boolean
  message: string
  assertNoInitialTx?: boolean
}) {
  if (assertNoInitialTx) {
    await test.step('assert no transaction on Activity tab', async () => {
      await pages.dashboard.checkNoTransactionOnActivityTab()
    })
  }

  await test.step('start send transfer', async () => {
    await pages.transfer.navigateToTransfer()
  })

  await test.step('add transfer amount', async () => {
    await pages.transfer.fillAmount(sendToken)
  })

  await test.step('add recipient address', async () => {
    await pages.transfer.fillRecipient(recipientAddress)
  })

  await test.step('send transaction', async () => {
    await pages.transfer.signSlowSpeedTransaction({
      feeToken,
      payWithGasTank,
      sendToken,
      message
    })
  })

  await test.step('assert new transaction on Activity tab', async () => {
    await pages.transfer.checkSendTransactionOnActivityTab()
  })

  await test.step('assert funds sent to recipient address on explorer', async () => {
    const viewTransactionLink = pages.basePage.page
      .getByTestId(selectors.dashboard.viewTransactionLink)
      .first()

    const viewTransactionTab = await pages.basePage.handleNewPage(viewTransactionLink)

    expect(viewTransactionTab.url()).toContain('explorer.ambire.com')

    await pages.transfer.checkRecepientTransactionOnExplorer({
      newPage: viewTransactionTab,
      recepientAddress: recipientAddress
    })
  })
}

export async function runBatchTransferFlow({
  pages,
  sendToken,
  recipientAddress
}: {
  pages: PageManager
  sendToken: Token
  recipientAddress: string
}) {
  const page = pages.transfer.page

  await test.step('start monitoring requests', async () => {
    await pages.transfer.monitorRequests()
  })

  await test.step('start send transfer', async () => {
    await pages.transfer.navigateToTransfer()
  })

  await test.step('add first transaction', async () => {
    await pages.transfer.fillAmount(sendToken)
    await pages.transfer.fillRecipient(recipientAddress)
    await pages.transfer.addToBatch()
  })

  await test.step('add more transaction', async () => {
    await pages.transfer.click(selectors.addMoreButton)
  })

  await test.step('add second transaction', async () => {
    await pages.transfer.fillAmount(sendToken)
    await pages.transfer.fillRecipient(recipientAddress)
    await pages.transfer.addToBatch()
  })

  await test.step('go to dashboard', async () => {
    await pages.transfer.click(selectors.goDashboardButton)
  })

  await test.step('open AccountOp screen and sign', async () => {
    const context = page.context()
    const actionWindowPromise = new Promise<Page>((resolve) => {
      context.once('page', resolve)
    })

    await page.getByTestId(selectors.bannerButtonOpen).first().click()

    const actionWindow = await actionWindowPromise
    await actionWindow.getByTestId(selectors.signTransactionButton).click()

    await expect(actionWindow.getByTestId(selectors.txnConfirmed)).toBeVisible({
      timeout: 20000
    })

    await pages.transfer.checkRecepientTransactionOnExplorer({
      newPage: actionWindow,
      recepientAddress: recipientAddress,
      options: { expectedTransactionsCount: 2 }
    })
  })

  await test.step(
    'stop monitoring requests and expect no uncategorized requests to be made',
    async () => {
      const { uncategorized } = pages.transfer.getCategorizedRequests()
      pages.transfer.stopMonitorRequests()
      expect(uncategorized.length).toBeLessThanOrEqual(0)
    }
  )
}
