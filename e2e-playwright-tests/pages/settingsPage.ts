import { KEYSTORE_PASS } from 'constants/env'
import { networks } from 'constants/networks'
import selectors from 'constants/selectors'

import { expect } from '@playwright/test'

import { BasePage } from './basePage'

export class SettingsPage extends BasePage {
  async openSettingsGeneral() {
    await this.click(selectors.dashboard.hamburgerButton)
    await this.checkUrl('/settings/general')
  }

  async openNetworkPage() {
    await this.openSettingsGeneral()

    // go to Network page and assert url
    await this.page.locator('//div[contains(text(),"Network")]').first().click()
    await this.checkUrl('/settings/networks')
  }

  async openAccountsPage() {
    await this.openSettingsGeneral()

    // go to Add account page and assert url
    await this.page.locator('//div[contains(text(),"Accounts")]').first().click()
    await this.checkUrl('/settings/accounts')
  }

  async openCustomTokensPage() {
    await this.openSettingsGeneral()

    // go to Add account page and assert url
    await this.page.locator('//div[contains(text(),"Custom tokens")]').first().click()
    await this.checkUrl('/settings/manage-tokens')
  }

  async lockKeystore(): Promise<void> {
    await this.openSettingsGeneral()

    await this.expectElementVisible(selectors.lockExtensionButton)
    await this.click(selectors.lockExtensionButton)

    await this.checkUrl('/tab.html#/unlock')
  }

  async unlockKeystore(): Promise<void> {
    await this.openSettingsGeneral()

    await this.click(selectors.lockExtensionButton)
    await this.checkUrl('/tab.html#/unlock')

    await this.entertext(selectors.passphraseField, KEYSTORE_PASS)
    await this.click(selectors.buttonUnlock)
    await this.expectElementVisible(selectors.fullBalance)
  }

  async openExtensionPassword() {
    await this.openSettingsGeneral()
    // await this.click(selectors.lockExtensionButton) // TODO: change to id once we have it on FE
    await this.page.locator('//div[contains(text(),"Extension password")]').first().click()
    await this.checkUrl('/settings/device-password-change')
  }

  async changeKeystorePassword(currPass: string, newPass: string): Promise<void> {
    await this.entertext(selectors.enterCurrentPassField, currPass)
    await this.entertext(selectors.enterNewPassField, newPass)
    await this.entertext(selectors.repeatNewPassField, newPass)
    await this.click(selectors.changeDevicePassButton)
    // close success modal
    await this.click(selectors.devicePassSuccessModal)
  }

  async addNetworkManually(networkSymbol: string) {
    // go to network page
    await this.openNetworkPage()

    // add network manually
    await this.click(selectors.settingsAddNetworkManually)

    const network = networks[networkSymbol]
    await this.typeNetworkField('Network name', network.networkName)
    await this.typeNetworkField('Currency Symbol', network.ccySymbol)
    await this.typeNetworkField('Currency Name', network.ccyName)
    await this.typeNetworkField('RPC URL', network.rpcUrl)

    // confirm adding rpc url
    await this.page.locator(selectors.addRPCURLButton).click()
    await this.typeNetworkField('Block Explorer URL', network.explorerUrl)

    // add network
    await this.page.locator(selectors.addNetworkButton).click({ timeout: 5000 })
    await expect(this.page.locator(selectors.networkSuccessfullyAddedSnackbar)).toHaveText(
      'Network successfully added!'
    )
  }

  // TODO: once have IDs on FE remove this method and use .fill() instead
  async typeNetworkField(field: string, text: string) {
    const selector = `//div[text()="${field}"]/following-sibling::div//input`
    await this.page.waitForSelector(selector, { state: 'visible', timeout: 5000 })
    await this.page.locator(selector).fill(text)
  }

  async addNetworkFromChainlist(networkSymbol: string) {
    await this.openNetworkPage()

    const network = networks[networkSymbol]

    // open chainlist page
    // TODO change once we have ID on FE
    const addNetworkFromChainlist = this.page.getByTestId(selectors.settingsAddNetworkFromChainlist)
    const chainlistTab = await this.handleNewPage(addNetworkFromChainlist)

    // open connect page
    const connectWalletButton = chainlistTab
      .locator('//button[contains(text(),"Connect Wallet")]')
      .first() // there are multiple Connect wallet buttons on page

    const connectPage = await this.handleNewPage(connectWalletButton)

    // confirm conection request
    await connectPage.getByTestId(selectors.dappConnectButton).click()

    // Sometimes dApp security checks take more time, and if we don't wait for them to complete,
    // the `addToMetamaskButton` won't be available in the next step and the test will fail.
    await expect(connectPage.getByTestId(selectors.dappSecurityCheckPassed)).toBeVisible({
      timeout: 10000
    })
    await this.page.waitForTimeout(1000)
    await chainlistTab.waitForSelector(selectors.chainlistSearchPlaceholder)
    await chainlistTab.locator(selectors.chainlistSearchPlaceholder).fill(network.networkName)

    // add to metamask
    await this.page.waitForTimeout(3000)
    const addToMetamaskButton = chainlistTab.locator(selectors.addToMetamaskButton)
    const addNetworkPage = await this.handleNewPage(addToMetamaskButton)
    await addNetworkPage.locator(selectors.confirmaddNetworkOnChainlistButton).click()

    // close chainlist tab
    await chainlistTab.waitForSelector(selectors.chainlistSearchPlaceholder)
    await chainlistTab.close()

    // verify network added on Network page
    await this.verifyNetworkAdded(networkSymbol)
  }

  async verifyNetworkAdded(networkSymbol: string) {
    await this.entertext(selectors.searchInput, networkSymbol)

    // select FLOW option
    await this.page.locator('//div[contains(text(),"Flow EVM Mainnet")]').first().click()

    // assert button is enabled
    await this.page.getByTestId(selectors.disableNetworkButton).isVisible()
  }

  // method working on networks page with network selected
  async editNetwork(networkSymbol: string) {
    const network = networks[networkSymbol]
    // assert network explorer URL
    await expect(this.page.locator(selectors.blockExplorerURL(network.explorerUrl))).toContainText(
      network.explorerUrl
    )

    // Select Edit, change 'Block Explorer URL' and 'Cancel'
    await this.page.locator(selectors.networkDetailEditButton).click()
    await this.page.locator(selectors.editNetworkModalTitle).isVisible()
    await this.typeNetworkField('Block Explorer URL', '/')
    await this.page.locator(selectors.editNetworkCancelButton).click()
    await expect(this.page.locator(selectors.blockExplorerURL(network.explorerUrl))).toContainText(
      network.explorerUrl
    )
    // Select Edit, change 'Block Explorer URL' and 'Save'
    await this.page.waitForTimeout(1000)
    await this.page.locator(selectors.networkDetailEditButton).click()
    await this.page.locator(selectors.editNetworkModalTitle).isVisible()
    await this.typeNetworkField('Block Explorer URL', `${network.explorerUrl}/test`)
    await this.page.locator(selectors.editNetworkSaveButton).click()

    // assert snackbar and new blockexplorer URL
    await expect(
      this.page.locator(selectors.networkSettingsSavedSnackbar(network.networkName))
    ).toHaveText(`${network.networkName} settings saved!`)
    await expect(this.page.locator(selectors.blockExplorerURL(network.explorerUrl))).toContainText(
      `${network.explorerUrl}/test`
    )
  }

  // method working on networks page with network selected
  async disableNetwork() {
    await this.click(selectors.disableNetworkButton)
    await this.click(selectors.disableNetworkConfirmButton)

    // assert button name changed
    await this.compareText(selectors.disableNetworkButton, 'Enable')
  }

  async addReadOnlyAccount(account: string) {
    // open add view-only address modal
    await this.click(selectors.settings.watchAnAddressButton)

    // enter address/ens
    await this.entertext(selectors.settings.viewOnlyAddressField, account)

    // assert validation
    await expect(this.page.locator(selectors.settings.validENSDomainText)).toHaveText(
      'Valid ENS domain'
    )
    // TODO: check for better solution
    // Start timing only when import begins
    const start = Date.now()

    // add account
    await this.click(selectors.settings.viewOnlyImportButton)

    // assert success text
    await expect(this.page.locator(selectors.settings.addedSuccessfullyText)).toHaveText(
      'Added successfully'
    )
    const duration = Date.now() - start
    console.log(`Import took ${duration} ms`)

    // complete and assert info text
    await this.click(selectors.saveAndContinueBtn)

    // assert info text
    await expect(this.page.locator(selectors.settings.accessAccFromDashboardInfoText)).toHaveText(
      'You can access your accounts from the dashboard via the extension icon.'
    )
  }

  async unhideToken() {
    await this.click(selectors.settings.unhideTokenButton)
    // assert snackbar
    const snackbarNotification = this.page.locator(
      '//span[contains(text(),"Token is now visible.")]'
    )
    await expect(snackbarNotification).toContainText(
      'Token is now visible. You can hide it again from the dashboard.'
    )

    // assert no hidden tokens message on page; in this case hidden tokens message is second
    await this.compareText(
      selectors.settings.youDontHaveInfoText,
      "You don't have any hidden tokens",
      { index: 1 }
    )
  }

  // TODO: could be improved to pass network dynamically
  async addCustomToken(tokenAdress: string, network: string, tokenName: string) {
    await this.click(selectors.settings.customTokens.addCustomTokenButton)

    // assert at token modal
    await this.compareText(selectors.settings.customTokens.addTokenModalTitle, 'Add Token')

    // choose network; ETH is selected by default; clicking it opens dropdown
    await this.click(selectors.settings.customTokens.ethNetworkOption)
    await this.click(selectors.settings.customTokens.arbitrumNetworkOption)

    // add token address; assert token name and confirmation pill (appears if address is valid)
    await this.entertext(selectors.settings.customTokens.tokenAddressField, tokenAdress)
    await this.compareText(selectors.settings.customTokens.customNameTokenText, tokenName)
    await this.compareText(selectors.settings.customTokens.confirmedPillText, 'Confirmed')

    // add token and assert snackbar
    await this.click(selectors.settings.customTokens.addTokenButton)

    await expect(this.page.locator(selectors.settings.customTokens.addedTokenSnackbar)).toHaveText(
      `Added token ${tokenAdress} on ${network} to your portfolio`
    )
  }

  async removeCustomToken() {
    await this.click(selectors.settings.customTokens.removeCustomTokenButton)

    // assert snackbar
    await expect(
      this.page.locator(selectors.settings.customTokens.tokenRemovedSnackbar)
    ).toHaveText('Token removed')

    // assert no custom tokens message on page
    await this.compareText(
      selectors.settings.youDontHaveInfoText,
      "You don't have any custom tokens"
    )
  }
}
