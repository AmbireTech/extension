import { KEYSTORE_PASS, PRIVATE_KEY } from 'constants/env'
import locators from 'constants/locators'
import selectors from 'constants/selectors'
import BootstrapContext from 'interfaces/bootstrapContext'

import mainConstants from '../constants/mainConstants'
import { BasePage } from './basePage'

export class AuthPage extends BasePage {
  extensionURL: string

  constructor(opts: BootstrapContext) {
    super(opts)
    this.extensionURL = opts.extensionURL
  }

  async goToDashboard() {
    await this.page.goto(`${this.extensionURL}${mainConstants.urls.dashboard}`)
  }

  async setExtensionPassword(): Promise<void> {
    await this.entertext(selectors.getStarted.enterPassField, KEYSTORE_PASS)
    await this.entertext(selectors.getStarted.repeatPassField, KEYSTORE_PASS)
    await this.click(selectors.getStarted.createKeystorePassBtn)
  }

  async decryptBackup(): Promise<void> {
    await this.page.getByTestId(selectors.passphraseField).fill(KEYSTORE_PASS)
    await this.page.getByTestId(selectors.submitButton).click()
  }

  // TODO: improve method assertions
  async importViewOnlyAccount(account: string): Promise<void> {
    await this.click(selectors.getStarted.watchAddress)
    await this.entertext(selectors.getStarted.addressEnsField, account)
    await this.click(selectors.getStarted.viewOnlyBtnImport)
    await this.setExtensionPassword()
    await this.compareText(
      selectors.getStarted.confirmationMessageForViewOnly,
      'Added successfully'
    )
    await this.click(selectors.getStarted.saveAndContinueBtn)
    await this.compareText(
      selectors.getStarted.confirmationMessageAmbireWallet,
      'Ambire Wallet is ready to use'
    )
    await this.click(selectors.getStarted.openDashboardButton)
    // assertion on Dashboard after login
  }

  async verifyRecoveryPhraseScreen(): Promise<void> {
    const locator = this.page.getByTestId('info-0').locator('div').nth(3)
    if (
      await this.page
        .getByText('Page was restarted because')
        .isVisible()
        .catch(() => false)
    ) {
      await locator.waitFor({ state: 'visible' })
      await locator.click()
    }
    await this.isVisible(selectors.getStarted.recoveryPhraseHeader)
    await this.click(selectors.getStarted.copyRecoveryPhraseButton)
    await this.compareText(
      selectors.getStarted.recoveryPhraseCopiedSnackbar,
      'Recovery phrase copied to clipboard'
    )
    await this.page
      .getByTestId(selectors.getStarted.recoveryPhraseCopiedSnackbar)
      .waitFor({ state: 'hidden' })
    await this.click(selectors.getStarted.savedPhraseButton)
  }

  // TODO: imporove method assertions
  async createNewAccount(): Promise<void> {
    await this.click(selectors.getStarted.createNewAccountButton)
    for (let index = 0; index < 3; index++) {
      await this.click(selectors.getStarted.checkbox, index)
    }
    await this.click(selectors.getStarted.createRecoveryPhraseButton)
    await this.verifyRecoveryPhraseScreen()
    await this.setExtensionPassword()
    // assertion on Dashboard after login
    await this.compareText(
      selectors.getStarted.confirmationMessageForViewOnly,
      'Added successfully'
    )
    await this.compareText(selectors.getStarted.addMoreAccountsButton, 'Add more accounts')
    await this.click(selectors.getStarted.saveAndContinueBtn)
    await this.compareText(
      selectors.getStarted.confirmationMessageAmbireWallet,
      'Ambire Wallet is ready to use'
    )
    await this.click(selectors.getStarted.openDashboardButton)
  }

  // TODO: imporove method assertions
  async importExistingAccount(): Promise<void> {
    await this.click(selectors.getStarted.importExistingAccBtn)
    await this.click(selectors.getStarted.importMethodPrivateBtn)
    await this.entertext(selectors.getStarted.enterPrivateKeyField, PRIVATE_KEY)
    await this.click(selectors.getStarted.warningCheckbox)
    await this.click(selectors.getStarted.importBtn)
    await this.setExtensionPassword()
    // assertion on Dashboard after login
    await this.compareText(
      selectors.getStarted.confirmationMessageForViewOnly,
      'Added successfully'
    )
    await this.click(selectors.getStarted.saveAndContinueBtn)
    await this.compareText(
      selectors.getStarted.confirmationMessageAmbireWallet,
      'Ambire Wallet is ready to use'
    )
    await this.click(selectors.getStarted.openDashboardButton)
  }

  // TODO: imporove method assertions
  async importExistingAccountByRecoveryPhrase(passphrase: string): Promise<void> {
    await this.click(selectors.getStarted.importExistingAccBtn)
    await this.click(selectors.getStarted.importMethodRecoveryPhrase)
    await this.entertext(selectors.getStarted.enterSeedPhraseField, passphrase)
    // enter phrase and recovery phrase
    // await this.click(selectors.getStarted.advancedPassPhraseSwitch) // TODO: added selector is not working
    await this.page.locator(locators.recoveryPhraseAdvancedModeToggle).click()
    await this.entertext(selectors.getStarted.recoveryPhrasePassphraseField, passphrase)
    // import
    await this.click(selectors.getStarted.importBtn)
    // set pass and name
    await this.setExtensionPassword()
    await this.personalizeAccountName('Name 1')
    // assertion on Dashboard after login
    await this.compareText(selectors.getStarted.addMoreAccountsButton, 'Add more accounts')
    await this.click(selectors.getStarted.saveAndContinueBtn)
    await this.compareText(
      selectors.getStarted.confirmationMessageAmbireWallet,
      'Ambire Wallet is ready to use'
    )
    await this.click(selectors.getStarted.openDashboardButton)
  }

  async personalizeAccountName(name: string): Promise<void> {
    // clear field input first
    await this.click(selectors.getStarted.editFirstAccNameButton)
    await this.entertext(selectors.getStarted.editAccountNameInputField, name)
    await this.compareText(selectors.getStarted.editFirstAccNameButton, 'Save')
  }

  // TODO: imporove method assertions
  async importCoupleOfViewOnlyAccount(account1: string, account2: string): Promise<void> {
    await this.click(selectors.getStarted.watchAddress)
    // add address 1
    await this.entertext(selectors.getStarted.addressEnsField, account1)
    // add address 2
    await this.click(selectors.getStarted.addOneMoreAddress)
    await this.entertext(selectors.getStarted.addressEnsField, account2, 1)
    // import
    await this.click(selectors.getStarted.viewOnlyBtnImport)
    // set pass and name
    await this.setExtensionPassword()
    // assertion on Dashboard after login
    await this.compareText(
      selectors.getStarted.confirmationMessageForViewOnly,
      'Added successfully'
    )
    await this.personalizeAccountName('Name 1')
    await this.click(selectors.getStarted.saveAndContinueBtn)
    await this.compareText(
      selectors.getStarted.confirmationMessageAmbireWallet,
      'Ambire Wallet is ready to use'
    )
    await this.click(selectors.getStarted.openDashboardButton)
  }

  async createNewHotWalletAndPersonalizeName(): Promise<void> {
    await this.click(selectors.getStarted.createNewAccountButton)
    for (let index = 0; index < 3; index++) {
      await this.click(selectors.getStarted.checkbox, index)
    }
    await this.click(selectors.getStarted.createRecoveryPhraseButton)
    await this.verifyRecoveryPhraseScreen()
    await this.setExtensionPassword()
    await this.click(selectors.getStarted.addMoreAccountsButton)
    await this.page.locator(locators.smartAccountPicker).click()
    // await this.click(selectors.getStarted.smartAccountPicker, 5) // TODO: not working
    await this.click(selectors.getStarted.importAccountButton)
    await this.compareText(
      selectors.getStarted.confirmationMessageForViewOnly,
      'Added successfully'
    )
    await this.personalizeAccountName('Name 1')
    await this.isVisible(selectors.getStarted.addMoreAccountsButton)
    await this.click(selectors.getStarted.saveAndContinueBtn)
    await this.compareText(
      selectors.getStarted.confirmationMessageAmbireWallet,
      'Ambire Wallet is ready to use'
    )
    await this.click(selectors.getStarted.openDashboardButton)
  }

  async selectHDPath(path: string): Promise<void> {
    await this.page.waitForTimeout(3000)
    await this.expectButtonEnabled(selectors.getStarted.changeHDPathButton)
    await this.click(selectors.getStarted.changeHDPathButton)
    await this.isVisible(path)
    await this.click(path)
    await this.click(selectors.getStarted.hdPathConfirmButton)
  }

  async createAccountAndImportFromDifferentHDPath(): Promise<void> {
    await this.click(selectors.getStarted.createNewAccountButton)
    for (let index = 0; index < 3; index++) {
      await this.click(selectors.getStarted.checkbox, index)
    }
    await this.click(selectors.getStarted.createRecoveryPhraseButton)
    await this.verifyRecoveryPhraseScreen()
    await this.setExtensionPassword()
    await this.expectButtonEnabled(selectors.getStarted.addMoreAccountsButton)
    await this.click(selectors.getStarted.addMoreAccountsButton)
    await this.selectHDPath(selectors.getStarted.hdPathLegerLive)
    await this.page.locator(locators.smartAccountPicker).click()
    // await this.click(selectors.getStarted.smartAccountPicker, 5) // TODO: not working
    await this.click(selectors.getStarted.importAccountButton)
    await this.compareText(
      selectors.getStarted.confirmationMessageForViewOnly,
      'Added successfully'
    )
    // add another acc
    await this.expectButtonEnabled(selectors.getStarted.addMoreAccountsButton)
    await this.click(selectors.getStarted.addMoreAccountsButton)
    await this.selectHDPath(selectors.getStarted.hdPathLegerLive)
    await this.page.locator(locators.smartAccountPicker).click()
    // await this.click(selectors.getStarted.smartAccountPicker, 5) // TODO: not working
    await this.click(selectors.getStarted.importAccountButton)
    await this.compareText(
      selectors.getStarted.confirmationMessageForViewOnly,
      'Added successfully'
    )
    await this.isVisible(selectors.getStarted.addMoreAccountsButton)
    await this.click(selectors.getStarted.saveAndContinueBtn)
    await this.compareText(
      selectors.getStarted.confirmationMessageAmbireWallet,
      'Ambire Wallet is ready to use'
    )
    await this.click(selectors.getStarted.openDashboardButton)
  }

  // TODO: imporove method assertions
  async importAccountFromJSONFile(): Promise<void> {
    const saAccounts = JSON.parse(process.env.SA_ACCOUNT_JSON || '{}')
    const jsonBuffer = Buffer.from(JSON.stringify(saAccounts))

    await this.click(selectors.getStarted.importExistingAccBtn)
    await this.click(selectors.getStarted.showMoreBtn)
    await this.click(selectors.getStarted.importMethodJSON)
    const fileInput = this.page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'sa.json',
      mimeType: 'application/json',
      buffer: jsonBuffer
    })
    await this.decryptBackup()
    await this.setExtensionPassword()
    // assertion on Dashboard after login
    await this.click(selectors.getStarted.saveAndContinueBtn)
    await this.compareText(
      selectors.getStarted.confirmationMessageAmbireWallet,
      'Ambire Wallet is ready to use'
    )
    await this.click(selectors.getStarted.openDashboardButton)
  }
}
