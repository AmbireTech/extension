import { saParams } from 'constants/env'
import selectors from 'constants/selectors'
import tokens from 'constants/tokens'
import { test } from 'fixtures/pageObjects'
import { createSiweMessage } from 'viem/siwe'

import { expect, Page } from '@playwright/test'

test.describe('auto-login', { tag: '@autoLogin' }, () => {
  test.setTimeout(60000)

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
    await test.step('Navigate to sigtool', async () => {
      await pages.initWithStorage(saParams)
      await pages.basePage.navigateToURL('https://sigtool.ambire.com/')
    })

    await test.step('connect wallet', async () => {
      const page = pages.basePage.page
      // selectors
      const connectWallet = page.locator(selectors.sigtool.connectWalletButton)
      const metamask = page.locator(selectors.sigtool.metamaskOption)
      const connectionSuccessfulText = page.locator(selectors.sigtool.connectionSuccessfulText)

      await connectWallet.click()

      const ambireAppConnectWindow = await pages.basePage.handleNewPage(metamask)

      // sign to connect
      ambireAppConnectWindow.getByTestId(selectors.dappConnectButton).click()
      await connectionSuccessfulText.isVisible()
    })
  })

  test.afterEach(async ({ context }) => {
    await context.close()
  })

  test('Disabling auto-login works', async ({ pages }) => {
    const page = pages.basePage.page
    // selectors
    const textBox = page.getByRole('textbox', { name: 'Message (Hello world)' })
    const signButton = page.locator(selectors.sigtool.signButton)
    // const messageSignatureTitle = page.locator()

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
      await expect(
        signMessageWindow.locator(selectors.sigtool.messageSignatureTitle)
      ).toContainText('Message signature')
    })

    await test.step('enter message again', async () => {
      await textBox.fill(message)
    })

    await test.step('sing action opens SIWE page', async () => {
      const signMessageWindow = await pages.basePage.handleNewPage(signButton)
      await signMessageWindow.locator(selectors.sigtool.signRequestForEVMText).isVisible()
    })
  })

  test('Enabling auto-login works', async ({ pages }) => {
    const page = pages.basePage.page
    // selectors
    const textBox = page.getByRole('textbox', { name: 'Message (Hello world)' })
    const signButton = page.locator(selectors.sigtool.signButton)
    const messageSignatureTitle = page.locator(selectors.sigtool.messageSignatureTitle)

    await test.step('enter message', async () => {
      await textBox.fill(message)
    })

    await test.step('check auto-login enabled and sign', async () => {
      const signMessageWindow = await pages.basePage.handleNewPage(signButton)

      await expect(
        signMessageWindow.locator(selectors.sigtool.autoLoginSwitch).first()
      ).toBeEnabled()
      await signMessageWindow.getByTestId(selectors.signMessageButton).click()
      await expect(messageSignatureTitle).toContainText('Message signature')
    })

    await test.step('enter message again', async () => {
      await textBox.fill(message)
    })

    await test.step('sing action does not open SIWE page, signature returned automatically', async () => {
      let siweWindowOpened = false

      // listener for new event; resolves true in case event happens
      page.on('popup', () => {
        siweWindowOpened = true
      })

      await signButton.click()
      expect(siweWindowOpened).toBe(false)
    })
  })

  test('Changing the network requires a new signature', async ({ pages, context }) => {
    const page = pages.basePage.page
    // selectors
    const textBox = page.getByRole('textbox', { name: 'Message (Hello world)' })
    const signButton = page.locator(selectors.sigtool.signButton)

    await test.step('change network to base on Ambire', async () => {
      await pages.dashboard.navigateToDashboard()
      await pages.dashboard.changeSigToolNetwork()

      // return to sigtool page
      await pages.basePage.navigateToURL('https://sigtool.ambire.com/')
    })

    await test.step('connect wallet to metamask again', async () => {
      const connectWallet = page.locator(selectors.sigtool.connectWalletButton)
      const metamask = page.locator(selectors.sigtool.metamaskOption)

      await connectWallet.click()
      await metamask.click()
    })

    await test.step('enter message with chainId set to Base', async () => {
      const messageWithDifferentChainId = {
        ...baseMessageConfig,
        chainId: 8453
      }
      const message = createSiweMessage(messageWithDifferentChainId)

      await textBox.fill(message)
    })

    await test.step('sing on SIWE page', async () => {
      const signMessageWindow = await pages.basePage.handleNewPage(signButton)
      await signMessageWindow.locator(selectors.sigtool.signRequestForEVMText).isVisible()

      await signMessageWindow.locator(selectors.sigtool.signInSiweButton).click()
    })

    await test.step('disconnect account from Ambire extension', async () => {
      await pages.dashboard.navigateToDashboard()
      await pages.dashboard.disconnectFromSigToolDapp()
    })

    await test.step('navigate to sigtool opens app connect request window', async () => {
      const page = pages.basePage.page
      const context = page.context()

      const [appConnectWindow] = await Promise.all([
        context.waitForEvent('page'),
        pages.basePage.navigateToURL('https://sigtool.ambire.com/')
      ])

      // wait for new window
      await appConnectWindow.waitForLoadState()
      // confirm connect request
      await appConnectWindow.locator(selectors.sigtool.signRequestForEVMText).isVisible()
      await appConnectWindow.getByTestId(selectors.dappConnectButton).click()
    })

    await test.step('enter message', async () => {
      await textBox.fill(message)
    })

    await test.step('sing action opens SIWE page', async () => {
      await page.pause()
      const signMessageWindow = await pages.basePage.handleNewPage(signButton)
      await signMessageWindow.locator(selectors.sigtool.signRequestForEVMText).isVisible()
    })
  })

  test('Remove account from extension and sign should return error', async ({ pages }) => {
    const page = pages.basePage.page
    // selectors
    const textBox = page.getByRole('textbox', { name: 'Message (Hello world)' })
    const signButton = page.locator(selectors.sigtool.signButton)

    await test.step('navigate to sigtool and connect wallet', async () => {
      const connectWallet = page.locator(selectors.sigtool.connectWalletButton)
      const metamask = page.locator(selectors.sigtool.metamaskOption)

      await pages.basePage.navigateToURL('https://sigtool.ambire.com/')

      // connect wallet
      await connectWallet.click()
      await metamask.click()
    })

    await test.step('remove account used for sign from ambire', async () => {
      await pages.dashboard.navigateToDashboard()
      await pages.settings.openAccountsPage()
      await pages.settings.removeLastAccount()
      await pages.auth.pause()
    })

    await test.step('navigate to sigtool', async () => {
      await pages.basePage.navigateToURL('https://sigtool.ambire.com/')
    })

    await test.step('connect wallet to metamask', async () => {
      const connectWallet = page.locator(selectors.sigtool.connectWalletButton)
      const metamask = page.locator(selectors.sigtool.metamaskOption)

      await connectWallet.click()
      await metamask.click()
    })

    await test.step('enter message', async () => {
      await textBox.fill(message)
    })

    await test.step('sing action should trigger error since account is removed', async () => {
      await page.locator(selectors.sigtool.signButton).click()
      await expect(page.locator(selectors.sigtool.error)).toHaveText(
        'Sign error: SIWE message address does not match the requested signing address'
      )
    })
  })

  test('Requesting an invalid SIWE message opens a regular sign message screen', async ({
    pages
  }) => {
    const page = pages.basePage.page
    // selectors
    const textBox = page.getByRole('textbox', { name: 'Message (Hello world)' })
    const signButton = page.locator(selectors.sigtool.signButton)

    await test.step('enter invalid SIWE message', async () => {
      const messageWithNoance = {
        ...baseMessageConfig,
        noance: 'foobar-baz'
      }

      const message = createSiweMessage(messageWithNoance)
      await textBox.fill(message)
    })

    await test.step('sing action opens SIWE page', async () => {
      const signMessageWindow = await pages.basePage.handleNewPage(signButton)
      await signMessageWindow.locator(selectors.sigtool.signRequestForEVMText).isVisible()
    })
  })

  test("An error is displayed if the domain doesn't match the requesting dapp", async ({
    pages
  }) => {
    const page = pages.basePage.page
    // selectors
    const textBox = page.getByRole('textbox', { name: 'Message (Hello world)' })
    const signButton = page.locator(selectors.sigtool.signButton)

    await test.step('extend message with domain', async () => {
      const messageWithDomain = {
        ...baseMessageConfig,
        domain: 'app.aave.com'
      }

      const message = createSiweMessage(messageWithDomain)
      await textBox.fill(message)
    })

    await test.step('sing action should result with error on SIWE page', async () => {
      const signMessageWindow = await pages.basePage.handleNewPage(signButton)
      await expect(signMessageWindow.locator(selectors.sigtool.deceptiveAppError)).toHaveText(
        'Deceptive app request'
      )
      await expect(
        signMessageWindow.locator(selectors.sigtool.deceptiveAppErrorDescription)
      ).toHaveText(
        "The app you're attempting to sign in to does not match the domain in the message. This may be a phishing attempt."
      )
    })
  })
})
