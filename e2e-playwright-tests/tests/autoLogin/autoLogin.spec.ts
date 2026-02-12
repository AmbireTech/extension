import { saParams } from 'constants/env'
import selectors from 'constants/selectors'
import tokens from 'constants/tokens'
import { test } from 'fixtures/pageObjects'
import { createSiweMessage } from 'viem/siwe'

import { expect } from '@playwright/test'

test.describe('auto-login', () => {
  const baseMessageConfig = {
    address: '0xBe3fE49CEdb755DA5bfCC71b5df9a167706290f1' as `0x${string}`, // SA address
    chainId: 1,
    domain: 'sigtool.ambire.com',
    nonce: 'foobarbaz',
    uri: 'https://sigtool.ambire.com/',
    version: '1' as const
  }

  const message = createSiweMessage(baseMessageConfig)

  test.beforeEach(async ({ pages }) => {
    await pages.initWithStorage(saParams)
    await pages.basePage.navigateToURL('https://sigtool.ambire.com/')
    // await pages.signMessage.navigateToSigTool()
  })

  test.afterEach(async ({ context }) => {
    await context.close()
  })

  test('Disabling auto-login works', async ({ pages }) => {
    const page = pages.basePage.page
    // selectors
    const connectWallet = page.locator(selectors.sigtool.connectWalletButton)
    const metamask = page.locator(selectors.sigtool.metamaskOption)
    const connectionSuccessfulText = page.locator(selectors.sigtool.connectionSuccessfulText)
    const textBox = page.getByRole('textbox', { name: 'Message (Hello world)' })
    const signButton = page.locator(selectors.sigtool.signButton)
    const signatureResultTitle = page.locator(selectors.sigtool.signatureResultTitleText)

    await test.step('connect wallet', async () => {
      await connectWallet.click()

      const ambireAppConnectWindow = await pages.basePage.handleNewPage(metamask)

      // sign to connect
      ambireAppConnectWindow.getByTestId(selectors.dappConnectButton).click()
      await connectionSuccessfulText.isVisible()
    })

    await test.step('enter message', async () => {
      await textBox.fill(message)
    })

    await test.step('disable auto-login and sign', async () => {
      const signMessageWindow = await pages.basePage.handleNewPage(signButton)

      await signMessageWindow
        .locator(selectors.sigtool.autoLoginSwitch)
        .first()
        .click({ force: true })
      await signMessageWindow.getByTestId(selectors.signMessageButton).click()
      await expect(signatureResultTitle).toContainText('Message signature')
    })

    await test.step('enter message again', async () => {
      await textBox.fill(message)
    })

    await test.step('sing action opens SIWE page', async () => {
      const signMessageWindow = await pages.basePage.handleNewPage(signButton)
      await signMessageWindow.locator(selectors.sigtool.signRequestForEVMText).isVisible()
    })
  })
})
