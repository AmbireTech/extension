import { saParams } from 'constants/env'
import selectors from 'constants/selectors'
import { test } from 'fixtures/pageObjects'

test.describe('Add account', { tag: '@addAccount' }, () => {
  test.beforeEach(async ({ pages }) => {
    await pages.initWithStorage(saParams)
  })

  test.afterEach(async ({ context }) => {
    await context.close()
  })

  test('import whale account via ENS from Settings', async ({ pages }) => {
    await test.step('open Accounts page from settings', async () => {
      await pages.settings.openAccountsPage()
    })

    await test.step('import vitalik.eth account', async () => {
      await pages.basePage.click(selectors.settings.addAccountButton)
      await pages.settings.addReadOnlyAccount('vitalik.eth')
    })

    await test.step('navigate to dashboard and check view-only account', async () => {
      await pages.dashboard.navigateToDashboard()

      // assert account name
      await pages.basePage.compareText(selectors.accountSelectBtn, 'vitalik.eth')
    })
  })
})
