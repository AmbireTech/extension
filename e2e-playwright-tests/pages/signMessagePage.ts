import { BA_ADDRESS, LEDGER_ADDRESS } from 'constants/env'
import selectors from 'constants/selectors'
import { SpeculosDevice } from 'libs/speculos-device'

import { expect } from '@playwright/test'

import { BasePage } from './basePage'

export class SignMessagePage extends BasePage {
  async signMessage(
    message: string,
    type: 'plain' | 'hex' | 'typed',
    ledgerSimulatorControls: SpeculosDevice = undefined,
    expectedSignerAddress?: string
  ) {
    await this.page.goto('https://sigtool.ambire.com/')

    const dappSelectors = {
      plain: {
        sign: this.page.getByText('Human Message', { exact: true }),
        verify: this.page.getByRole('link', { name: 'Human Message' }),
        messageTextarea: this.page.getByRole('textbox', { name: 'Message (Hello world)' })
      },
      hex: {
        sign: this.page.getByText('Hexadecimal', { exact: true }),
        verify: this.page.getByRole('link', { name: 'Hexadecimal' }),
        messageTextarea: this.page.getByRole('textbox', { name: 'Message (0x......)' })
      },
      typed: {
        sign: this.page.getByText('Typed Data', { exact: true }),
        verify: this.page.getByRole('link', { name: 'Typed Data' }),
        messageTextarea: this.page.getByRole('textbox', { name: '{ domain : {}, types: {},' })
      }
    }

    const signSubTab = dappSelectors[type].sign
    const verifySubTab = dappSelectors[type].verify
    const messageTextarea = dappSelectors[type].messageTextarea

    // Wait for the extension's ethereum provider to be injected before sigtool's wallet
    // detection runs, otherwise the MetaMask option may not appear in the connect modal.
    await this.page.waitForFunction(() => Boolean((window as any).ethereum), { timeout: 10000 })

    const connect = this.page.getByRole('button', { name: 'connect wallet' })
    await connect.click()

    // Dapp Request request window
    const ambire = this.page.getByRole('button', { name: 'MetaMask' })
    const actionWindowPagePromise = this.handleNewPage(ambire)

    // Connect
    const actionWindowPage = await actionWindowPagePromise
    const dappConnect = actionWindowPage.getByTestId(selectors.dappConnectButton)
    await dappConnect.click()

    await signSubTab.click()

    // Type plain text message
    await messageTextarea.fill(message)

    // Sign
    const sign = this.page.getByRole('button', { name: 'Sign' })
    const signActionWindowPagePromise = this.handleNewPage(sign)

    const signActionWindowPage = await signActionWindowPagePromise
    // Wait for the sign button to render in the freshly opened action window instead of a fixed
    // sleep, so we proceed as soon as the window is ready.
    const signMessageButton = signActionWindowPage.getByTestId(selectors.signMessageButton)
    await expect(signMessageButton).toBeVisible({ timeout: 30000 })
    await signMessageButton.click()

    if (ledgerSimulatorControls) {
      // Wait for the "Review message" screen to appear on the Ledger device before confirming the transaction flow.
      const isReadyToSign = await ledgerSimulatorControls.waitForText('Review message')

      if (isReadyToSign) {
        // Confirm the transaction flow on the Ledger device.
        await ledgerSimulatorControls.confirmTransactionFlow()
      } else {
        throw new Error('Ledger device is not ready to sign the message')
      }
    }

    const signature = await this.page.locator('.signatureResult-signature').first().innerText()

    // Verify
    const verifyTab = this.page.getByRole('link', { name: 'Verify' })
    await verifyTab.click()

    const signerAddress = this.page.getByRole('textbox', { name: 'Signer address (0x....)' })
    if (ledgerSimulatorControls) {
      await signerAddress.fill(LEDGER_ADDRESS)
    } else {
      await signerAddress.fill(expectedSignerAddress ?? BA_ADDRESS)
    }

    await verifySubTab.click()

    await messageTextarea.fill(message)

    const signatureTextbox = this.page.locator('textarea.formInput-signature').first()
    await signatureTextbox.fill(signature)

    const networkSelector = this.page.getByText('Select Network')
    await networkSelector.click()

    // Polygon is selected since Ethereum RPC verification fails in SigTool.
    // For testing purposes, this is not an issue because signing the same message
    // on Ethereum or Polygon yields an identical signature.
    // TODO: Check is Polygon is needed in general, because in the sigtool is already fixed
    let selectedNetwork
    if (ledgerSimulatorControls) {
      selectedNetwork = this.page.locator('.networkName', { hasText: 'Ethereum' })
    } else {
      selectedNetwork = this.page.locator('.networkName', { hasText: 'Polygon' })
    }
    await selectedNetwork.click()

    const verifyButton = this.page.getByRole('button', { name: 'Verify' })
    await verifyButton.click()

    // Here we added a slightly higher timeout as a hotfix, since the public RPCs used in SigTool are sometimes slow to respond.
    // As a better solution, we plan to replace the RPCs with Invictus.
    await expect(this.page.locator('.verifyFeedback-text')).toHaveText('Signature is Valid', {
      timeout: 60000
    })
  }
}
