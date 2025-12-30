import { saParams } from 'constants/env'
import selectors from 'constants/selectors'
import tokens from 'constants/tokens'
import { test } from 'fixtures/pageObjects'
import { ambireRewardsText } from 'pages/utils/data/ambireRewardsText'

import { expect, Page } from '@playwright/test'

test.describe('dashboard', () => {
  test.beforeEach(async ({ pages }) => {
    await pages.initWithStorage(saParams)
  })

  test.afterEach(async ({ context }) => {
    await context.close()
  })

  test('should have balance on the dashboard', async ({ pages }) => {
    await pages.dashboard.checkBalanceInAccount()
  })

  test('should test if expected tokens are visible on the dashboard', async ({ pages }) => {
    await pages.dashboard.checkIfTokensExist()
  })

  test('should test if expected NFTs are visible on the dashboard', async ({ pages }) => {
    await pages.dashboard.checkCollectibleItem()
  })

  test('import whale account via ENS from Dashboard', async ({ pages }) => {
    await test.step('open add account modal from dashboard', async () => {
      await pages.basePage.click(selectors.accountSelectBtn)
      await pages.basePage.click(selectors.buttonAddAccount)
    })

    await test.step('import vitalik.eth account', async () => {
      await pages.settings.addReadOnlyAccount('vitalik.eth')
    })

    await test.step('naigate to dashboard and check view-only account', async () => {
      await pages.dashboard.navigateToDashboard()

      // assert account name
      await pages.basePage.compareText(selectors.accountSelectBtn, 'vitalik.eth')
    })
  })

  test('Filter Tokens by Network', async ({ pages }) => {
    // SA should have 5 tokens on Base network - wallet, usdc, usdt, eth, clBtc
    const wallet = tokens.wallet.base
    const usdc = tokens.usdc.base
    const usdt = tokens.usdt.base
    const eth = tokens.eth.base
    const clBtc = tokens.clbtc.base

    await test.step('search Tokens by network - Base', async () => {
      await pages.dashboard.search('Base', 'tokens')
    })

    await test.step('assert search result', async () => {
      await pages.basePage.isVisible(`token-balance-${wallet.address}.${wallet.chainId}`)
      await pages.basePage.isVisible(`token-balance-${usdc.address}.${usdc.chainId}`)
      await pages.basePage.isVisible(`token-balance-${usdt.address}.${usdt.chainId}`)
      await pages.basePage.isVisible(`token-balance-${eth.address}.${eth.chainId}`)
      await pages.basePage.isVisible(`token-balance-${clBtc.address}.${clBtc.chainId}`)
    })
  })

  test('Filter Tokens by token name', async ({ pages }) => {
    // SA should have 3 tokens containing USDC - base/optimism/polygon
    const usdcMainnet = tokens.usdc.optimism
    const usdcBase = tokens.usdc.base
    const usdcPolygon = tokens.usdc.polygon

    await test.step('search Tokens by token name - USDC', async () => {
      await pages.dashboard.search('USDC', 'tokens')
    })

    await test.step('assert search result', async () => {
      await pages.basePage.isVisible(`token-balance-${usdcMainnet.address}.${usdcMainnet.chainId}`)
      await pages.basePage.isVisible(`token-balance-${usdcBase.address}.${usdcBase.chainId}`)
      await pages.basePage.isVisible(`token-balance-${usdcPolygon.address}.${usdcPolygon.chainId}`)
    })
  })

  test('Filter Token using network dropdown', async ({ pages }) => {
    // SA should have 5 tokens on Base network - wallet, usdc, usdt, eth, clBtc
    const wallet = tokens.wallet.base
    const usdc = tokens.usdc.base
    const usdt = tokens.usdt.base
    const eth = tokens.eth.base
    const clBtc = tokens.clbtc.base

    await test.step('select Base network via dropdown', async () => {
      await pages.dashboard.searchByNetworkDropdown('Base', 'tokens')
    })

    await test.step('assert search result', async () => {
      await pages.basePage.isVisible(`token-balance-${wallet.address}.${wallet.chainId}`)
      await pages.basePage.isVisible(`token-balance-${usdc.address}.${usdc.chainId}`)
      await pages.basePage.isVisible(`token-balance-${usdt.address}.${usdt.chainId}`)
      await pages.basePage.isVisible(`token-balance-${eth.address}.${eth.chainId}`)
      await pages.basePage.isVisible(`token-balance-${clBtc.address}.${clBtc.chainId}`)
    })
  })

  test('Search for non existing Token returns appropriate message', async ({ pages }) => {
    await test.step('search for non existing Token name - Test', async () => {
      await pages.dashboard.search('Test', 'tokens')
    })

    await test.step('assert no search result', async () => {
      await pages.dashboard.compareText(selectors.dashboard.noTokensText, 'No tokens match "Test".')
    })
  })

  test('Filter NFTs by Network', async ({ pages }) => {
    await test.step('navigate to tab NFTs', async () => {
      await pages.basePage.click(selectors.dashboard.nftTabButton)
    })

    await test.step('search NFTs by network - Ethereum', async () => {
      await pages.dashboard.search('Ethereum', 'collectibles')
    })

    await test.step('assert search result are visible', async () => {
      // 8 NFTs should be visible for SA
      const expectedTitles = ['Ambire Rewards']

      const collectibleTitle = pages.basePage.page.getByTestId(selectors.dashboard.nftTitle) // returns all items on page

      for (let i = 0; i < expectedTitles.length; i++) {
        await expect(collectibleTitle.nth(i)).toHaveText(expectedTitles[i])
      }
    })
  })

  test('Filter NFTs by token name', async ({ pages }) => {
    await test.step('navigate to tab NFTs', async () => {
      await pages.basePage.click(selectors.dashboard.nftTabButton)
    })

    await test.step('search by NFT name - Ambire Rewards', async () => {
      await pages.dashboard.search('Ambire Rewards', 'collectibles')
    })

    await test.step('assert search result', async () => {
      await pages.basePage.compareText(selectors.dashboard.nftTitle, 'Ambire Rewards')
    })
  })

  test('Filter NFTs using network dropdown', async ({ pages }) => {
    await test.step('navigate to tab NFTs', async () => {
      await pages.basePage.click(selectors.dashboard.nftTabButton)
    })

    await test.step('select Base network via dropdown', async () => {
      await pages.dashboard.searchByNetworkDropdown('Ethereum', 'collectibles')
    })

    await test.step('assert search result', async () => {
      // 8 NFTs should be visible for SA
      const expectedTitles = ['Ambire Rewards']

      const collectibleTitle = pages.basePage.page.getByTestId(selectors.dashboard.nftTitle) // returns all items on page

      for (let i = 0; i < expectedTitles.length; i++) {
        await expect(collectibleTitle.nth(i)).toHaveText(expectedTitles[i])
      }
    })
  })

  test('Search for non existing NFT returns appropriate message', async ({ pages }) => {
    await test.step('navigate to tab NFTs', async () => {
      await pages.basePage.click(selectors.dashboard.nftTabButton)
    })

    await test.step('search by NFT name - Test', async () => {
      await pages.dashboard.search('Test', 'collectibles')
    })

    await test.step('assert no search result', async () => {
      await pages.dashboard.compareText(
        selectors.dashboard.noCollectiblesText,
        'No collectibles (NFTs) match "Test".'
      )
    })
  })

  // TODO: add tests and assertions once we have protocols on FE
  // test.skip('Search Protocol by network dropdown', async ({ pages }) => {
  //   await test.step('navigate to tab DeFi', async () => {
  //     await pages.basePage.click(selectors.dashboard.defiTabButton)
  //   })

  //   await test.step('select Base network via dropdown', async () => {
  //     await pages.dashboard.searchByNetworkDropdown('Base', 'defi')
  //   })

  // TODO: ATM there are no protocols for SA; uncomment when we have protocols
  // await test.step('assert search result', async () => {
  //   await pages.basePage.expectItemsCount(selectors.dashboard.protocolTitle, 1)
  // })
  // })

  test('Search for non existing Defi Protocol returns appropriate message', async ({ pages }) => {
    await test.step('navigate to tab DeFi', async () => {
      await pages.basePage.click(selectors.dashboard.defiTabButton)
    })

    await test.step('search Protocol by name - Test', async () => {
      await pages.dashboard.search('Test', 'defi')
    })

    await test.step('assert no search result', async () => {
      await pages.basePage.compareText(
        selectors.dashboard.noProtocolsText,
        'No known protocols match "Test".'
      )
    })

    await test.step('assert suggestion - open a ticket page', async () => {
      await pages.dashboard.checkOpenTicketPage()
    })
  })

  test('Hide WALLET token from dashboard; then unhide it in settings', async ({ pages }) => {
    const wallet = tokens.wallet.base

    await test.step('open hide wallet modal', async () => {
      await pages.dashboard.click(`token-balance-${wallet.address}.${wallet.chainId}`)
      await pages.dashboard.click(selectors.dashboard.hideTokenButton)
    })

    await test.step('assert hide token modal text and confirm hide token', async () => {
      await pages.basePage.compareText(
        selectors.dashboard.hideTokenModalTitle,
        'Are you sure you want to hide this token?'
      )
      await pages.basePage.compareText(
        selectors.dashboard.hideTokenModalDescription,
        'You can always unhide it from the Settings menu > Custom tokens.'
      )

      await pages.basePage.click(selectors.dashboard.yesHideItButton)
    })

    await test.step('assert WALLET token not visible on Dashboard', async () => {
      await pages.basePage.expectElementNotVisible(
        `token-balance-${wallet.address}.${wallet.chainId}`
      )
    })

    await test.step('navigate to settings > custom tokens page', async () => {
      await pages.settings.openCustomTokensPage()
    })

    await test.step('WALLET token should be visible under hidden token list', async () => {
      await pages.basePage.compareText(selectors.settings.hiddenTokenName, 'WALLET')
      await pages.basePage.compareText(selectors.settings.hiddenTokenNetwork, 'Base')
    })

    await test.step('unhide WALLET token', async () => {
      await pages.settings.unhideToken()
    })

    await test.step('navigate to Dashboard', async () => {
      await pages.dashboard.navigateToDashboard()
    })

    await test.step('assert WALLET token is visible on Dashboard', async () => {
      await pages.settings.isVisible(`token-balance-${wallet.address}.${wallet.chainId}`)
    })
  })

  test('Check redirection to Ambire rewards page', async ({ pages }) => {
    await test.step('assert rewards button is visible', async () => {
      await pages.basePage.isVisible(selectors.dashboard.rewardsButton)
    })

    await test.step('rewards button should redirect to rewards page', async () => {
      await pages.dashboard.checkRewardsPageRedirection(selectors.dashboard.rewardsButton)
    })

    await test.step('assert WALLET asset button is visible', async () => {
      await pages.basePage.isVisible(selectors.dashboard.projectedRewardsButton)
    })

    await test.step('WALLET asset button should redirect to rewards page', async () => {
      await pages.dashboard.checkRewardsPageRedirection(selectors.dashboard.projectedRewardsButton)
    })
  })

  test.only('Check Ambire rewards home', async ({ pages }) => {
    const rewardsLink = pages.basePage.page.locator(selectors.dashboard.rewardsLink)
    let rewardsTab: Page

    await test.step('navigate to Ambire rewards home', async () => {
      await pages.basePage.click(selectors.dashboard.rewardsButton)

      rewardsTab = await pages.basePage.handleNewPage(rewardsLink)
    })

    await test.step('Check Season 2 pop up and redirection to announcement page', async () => {
      await expect(rewardsTab.locator('//h1[contains(text(),"Ambire Rewards")]')).toContainText(
        'Ambire Rewards Season 2 is here!'
      )

      await pages.auth.pause()

      // close pop up
      await rewardsTab.mouse.click(0, 100)
    })

    await test.step('Connect Ambire and check Home page', async () => {
      // check url
      expect(rewardsTab.url()).toContain('rewards.ambire.com')

      // await rewardsTab.locator('//button[contains(text(),"Connect Ambire")]').click()

      // check page content
    })

    await test.step('Check Leaderboard page', async () => {
      const leaderboardPage = rewardsTab.locator(selectors.ambireRewards.leaderboardPage)
      await leaderboardPage.click()

      // check url
      expect(rewardsTab.url()).toContain('/leaderboard')

      // check page content
      await expect(rewardsTab.locator(selectors.ambireRewards.pageTitle)).toContainText(
        ambireRewardsText.leaderboard.title
      )
      await expect(rewardsTab.locator(selectors.ambireRewards.pageDescription)).toContainText(
        ambireRewardsText.leaderboard.description
      )
    })

    await test.step('Check Rewards pool page', async () => {
      const rewardsPoolPage = rewardsTab.locator(selectors.ambireRewards.rewardsPoolPage)
      await rewardsPoolPage.click()

      // check url
      expect(rewardsTab.url()).toContain('/rewards-pool')

      // check page content
      await expect(rewardsTab.locator(selectors.ambireRewards.pageTitle)).toContainText(
        ambireRewardsText.rewardsPool.title
      )
      await expect(
        rewardsTab.locator(selectors.ambireRewards.pageDescription).first()
      ).toContainText(ambireRewardsText.rewardsPool.description)
      await expect(
        rewardsTab.locator(selectors.ambireRewards.pageDescription).nth(1)
      ).toContainText(ambireRewardsText.rewardsPool.season2description)
    })

    await test.step('Check $WALLET page', async () => {
      const walletPage = rewardsTab.locator(selectors.ambireRewards.walletPage)
      await walletPage.click()

      // check url
      expect(rewardsTab.url()).toContain('/wallet')

      // check page content
      // TODO:
    })

    await test.step('Check FAQ page', async () => {
      const faqContext = rewardsTab.context()

      // setup listener for new page
      const faqPagePromise = faqContext.waitForEvent('page', { timeout: 5000 })

      // initiate navigation to faq page
      await rewardsTab.locator(selectors.ambireRewards.faqPage).click()

      // wait for new tab
      const faqTab = await faqPagePromise
      await faqTab.waitForLoadState('domcontentloaded')

      // assert url
      expect(faqTab.url()).toContain('help.ambire.com')

      // close faq tab
      await faqTab.close()
    })
  })
})
