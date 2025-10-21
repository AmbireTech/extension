import { saParams } from 'constants/env'
import selectors from 'constants/selectors'
import tokens from 'constants/tokens'
import { test } from 'fixtures/pageObjects'

test.describe('settings', () => {
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

  test('add custom token - USDCe from Arbitrum network', async ({ pages }) => {
    const usdceArbitrum = tokens.usdce.arbitrum

    await test.step('open Custom tokens page from settings', async () => {
      await pages.settings.openCustomTokensPage()
    })

    await test.step('assert no custom token is visible on Custom tokens page', async () => {
      await pages.basePage.compareText(
        selectors.settings.youDontHaveInfoText,
        "You don't have any custom tokens"
      )
    })

    await test.step('add USDCe token from Arbitrum network', async () => {
      await pages.settings.addCustomToken(
        '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
        'Arbitrum',
        'USDC.E'
      )
    })

    await test.step('assert custom token is visible on Custom tokens page', async () => {
      await pages.basePage.compareText(selectors.settings.hiddenTokenName, 'USDC.E')
      await pages.basePage.compareText(selectors.settings.hiddenTokenNetwork, 'Arbitrum')
    })

    await test.step('assert custom token is visible on Dashboard page', async () => {
      await pages.dashboard.navigateToDashboard()

      // search added token and assert it
      await pages.dashboard.search('USDC.E', 'tokens')
      await pages.basePage.isVisible(
        `token-balance-${usdceArbitrum.address}.${usdceArbitrum.chainId}`
      )
    })

    await test.step('remove token on Custom token page', async () => {
      await pages.settings.openCustomTokensPage()

      // remove token and assert token not visible
      await pages.settings.removeCustomToken()
    })

    await test.step('assert token not visible on Dashboard', async () => {
      await pages.dashboard.navigateToDashboard()

      // search added token and assert it
      await pages.dashboard.search('USDC.E', 'tokens')
      await pages.basePage.expectElementNotVisible(
        `token-balance-${usdceArbitrum.address}.${usdceArbitrum.chainId}`
      )
    })
  })
})
