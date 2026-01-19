import { saParams } from 'constants/env'
import selectors from 'constants/selectors'
import { test } from 'fixtures/pageObjects'
import { ambireRewardsText } from 'pages/utils/data/ambireRewardsText'

import { expect, Page } from '@playwright/test'

test.describe('ambire rewards', { tag: '@rewards' }, () => {
  test.beforeEach(async ({ pages }) => {
    await pages.initWithStorage(saParams)
  })

  test.afterEach(async ({ context }) => {
    await context.close()
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

  test('Check Ambire rewards home', async ({ pages }) => {
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

      // check read announcement redirection
      const readAnnouncementButton = rewardsTab.locator(
        selectors.ambireRewards.readAnnouncementHyperlink
      )
      const announcementTab = await pages.basePage.handleNewPage(readAnnouncementButton, rewardsTab)
      expect(announcementTab.url()).toContain('blog.ambire.com/rewards-enters-season2/')

      // close announcement tab
      await announcementTab.close()
      // close pop up
      await rewardsTab.mouse.click(0, 100)
    })

    await test.step('Check Home page FAQ section', async () => {
      const faqs = [
        {
          questionSelector: selectors.ambireRewards.faqFirstQuestion,
          answerSelector: selectors.ambireRewards.faqFirstAnswer,
          question: ambireRewardsText.homeFAQ.firstQuestion,
          answer: ambireRewardsText.homeFAQ.answerToFirstQuestion
        },
        {
          questionSelector: selectors.ambireRewards.faqSecondQuestion,
          answerSelector: selectors.ambireRewards.faqSecondAnswer,
          question: ambireRewardsText.homeFAQ.secondQuestion,
          answer: ambireRewardsText.homeFAQ.answerToSecondQuestion
        },
        {
          questionSelector: selectors.ambireRewards.faqThirdQuestion,
          answerSelector: selectors.ambireRewards.faqThirdAnswer,
          question: ambireRewardsText.homeFAQ.thirdQuestion,
          answer: ambireRewardsText.homeFAQ.answerToThirdQuestion
        },
        {
          questionSelector: selectors.ambireRewards.faqFourthQuestion,
          answerSelector: selectors.ambireRewards.faqFourthAnswer,
          question: ambireRewardsText.homeFAQ.forthQuestion,
          answer: ambireRewardsText.homeFAQ.answerToFourthQuestion
        },
        {
          questionSelector: selectors.ambireRewards.faqFifthQuestion,
          answerSelector: selectors.ambireRewards.faqFifthAnswer,
          question: ambireRewardsText.homeFAQ.fifthQuestion,
          answer: ambireRewardsText.homeFAQ.answerToFifthQuestion
        },
        {
          questionSelector: selectors.ambireRewards.faqSixthQuestion,
          answerSelector: selectors.ambireRewards.faqSixthAnswer,
          question: ambireRewardsText.homeFAQ.sixthQuestion,
          answer: ambireRewardsText.homeFAQ.answerToSixthQuestion
        },
        {
          questionSelector: selectors.ambireRewards.faqSeventhQuestion,
          answerSelector: selectors.ambireRewards.faqSeventhAnswer,
          question: ambireRewardsText.homeFAQ.seventhQuestion,
          answer: ambireRewardsText.homeFAQ.answerToSeventhQuestion
        },
        {
          questionSelector: selectors.ambireRewards.faqEightQuestion,
          answerSelector: selectors.ambireRewards.faqEightAnswer,
          question: ambireRewardsText.homeFAQ.eightQuestion,
          answer: ambireRewardsText.homeFAQ.answerToEightQuestion
        },
        {
          questionSelector: selectors.ambireRewards.faqNinthQuestion,
          answerSelector: selectors.ambireRewards.faqNinthAnswer,
          question: ambireRewardsText.homeFAQ.ninthQuestion,
          answer: ambireRewardsText.homeFAQ.answerToNinthQuestion
        }
      ]

      for (const faq of faqs) {
        const question = rewardsTab.locator(faq.questionSelector)
        const answer = rewardsTab.locator(faq.answerSelector)

        await expect(question).toHaveText(faq.question)
        await question.click()
        await expect(answer).toHaveText(faq.answer)
      }
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
      const faqButton = rewardsTab.locator(selectors.ambireRewards.faqPage)
      const faqTab = await pages.basePage.handleNewPage(faqButton, rewardsTab)

      // assert url
      expect(faqTab.url()).toContain('help.ambire.com')

      // close faq tab
      await faqTab.close()
    })

    await test.step('Connect Ambire', async () => {
      const homeButton = rewardsTab.locator(selectors.ambireRewards.homePage)
      await homeButton.click()

      // check url
      expect(rewardsTab.url()).toContain('rewards.ambire.com')
      const connectWalletButton = rewardsTab.locator(selectors.ambireRewards.connectAmbireButton)
      const connectWalletTab = await pages.basePage.handleNewPage(connectWalletButton)

      await connectWalletTab.getByTestId(selectors.dappConnectButton).click()
      // await rewardsTab.waitForTimeout(5000) // wait for rewards banner to appear
      await expect(rewardsTab.locator(selectors.ambireRewards.claimRewardButton)).toBeVisible()
      // TODO: add more assertion when wallet is connected and disconnect wallet when we have IDs no
    })
  })
})
