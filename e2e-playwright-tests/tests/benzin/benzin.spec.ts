import selectors from 'constants/selectors'

import { expect, test } from '@playwright/test'

// A plain ETH transfer that succeeded on mainnet
const FINISHED_MAINNET_TXN_ID = '0x9e3e70998d70b43bc6e1e19315ef2ab29d096b0d64958169fd1ae7fa6fff4eb6'
const FINISHED_MAINNET_TXN_SENDER = '0x0e9E39190DF7A2d38872736910Cddfa519e419ca'
const FINISHED_MAINNET_TXN_BLOCK = '20000000'

test.describe('Benzin', { tag: '@benzin' }, () => {
  test('shows the progress of a finished transaction', async ({ page }) => {
    const pageErrors: Error[] = []
    page.on('pageerror', (error) => pageErrors.push(error))

    await page.goto(`/?chainId=1&txnId=${FINISHED_MAINNET_TXN_ID}`)

    await expect(page.getByText('Transaction Progress')).toBeVisible()
    await expect(page.getByText('on Ethereum')).toBeVisible()
    await expect(page.getByTestId(selectors.transaction.explorer.txnProgressStep)).toBeVisible()
    await expect(page.getByTestId(selectors.txnConfirmed)).toBeVisible()

    await expect(page.getByText(FINISHED_MAINNET_TXN_SENDER, { exact: true })).toBeVisible()
    await expect(page.getByText('Send', { exact: true })).toBeVisible()
    await expect(page.getByText('0.042', { exact: true })).toBeVisible()
    await expect(page.getByText('-0.042 ETH', { exact: true })).toBeVisible()
    await expect(page.getByText('confirmed', { exact: true })).toBeVisible()
    await expect(page.getByText(FINISHED_MAINNET_TXN_BLOCK, { exact: true })).toBeVisible()
    await expect(page.getByText('Open explorer')).toBeVisible()
    await expect(page.getByText('Copy link')).toBeVisible()

    await expect(page.getByText('Error loading transaction')).toBeHidden()
    await expect(page.getByText('Could not show your transaction progress')).toBeHidden()
    expect(pageErrors, pageErrors.map((error) => error.stack).join('\n\n')).toEqual([])
  })
})
