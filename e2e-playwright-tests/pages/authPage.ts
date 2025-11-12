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
    await this.page.getByTestId(selectors.enterPassField).fill(KEYSTORE_PASS)
    await this.page.getByTestId(selectors.repeatPassField).fill(KEYSTORE_PASS)
    await this.page.getByTestId(selectors.createKeystorePassBtn).click()
  }

  async decryptBackup(): Promise<void> {
    await this.page.getByTestId(selectors.passphraseField).fill(KEYSTORE_PASS)
    await this.page.getByTestId(selectors.submitButton).click()
  }

  // TODO: imporove method assertions
  async importViewOnlyAccount(account: string): Promise<void> {
    await this.click(selectors.getStarted.watchAddress)
    await this.entertext(selectors.getStarted.addressEnsField, account)
    await this.click(selectors.getStarted.viewOnlyBtnImport)
    await this.setExtensionPassword()
    // assertion on Dashboard after login
    await this.page.locator(locators.confirmationMessageForViewOnly).isVisible()
    await this.page.locator(locators.completeButton).click()
    await this.page.locator(locators.confirmationMessageAmbireWallet).isVisible()
    await this.page.locator(locators.openDashboardButton).click()
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
    await this.page.locator(locators.recoveryPhraseHeader).isVisible()
    await this.page.locator(locators.copyRecoveryPhraseButton).click()
    await this.page.getByText('Recovery phrase copied to').isVisible()
    await this.page.getByText('Recovery phrase copied to').waitFor({ state: 'detached' })
    await this.page.locator(locators.savedPhraseButton).click()
  }

  // TODO: imporove method assertions
  async createNewAccount(): Promise<void> {
    await this.page.locator(locators.createNewAccountButton).click()
    for (let index = 0; index < 3; index++) {
      // eslint-disable-next-line no-await-in-loop
      await this.page.locator(`div[data-testid="checkbox"] >> nth = ${index}`).click()
    }
    await this.page.locator(locators.createRecoveryPhraseButton).click()
    await this.verifyRecoveryPhraseScreen()
    await this.setExtensionPassword()
    // assertion on Dashboard after login
    await this.page.locator(locators.confirmationMessageForViewOnly).isVisible()
    await this.page.locator(locators.addMoreAccountsButton).isVisible()
    await this.page.locator(locators.completeButton).click()
    await this.page.locator(locators.confirmationMessageAmbireWallet).isVisible()
    await this.page.locator(locators.openDashboardButton).click()
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
    await this.page.locator(locators.confirmationMessageForViewOnly).isVisible()
    await this.page.locator(locators.addMoreAccountsButton).isVisible()
    await this.page.locator(locators.completeButton).click()
    await this.page.locator(locators.confirmationMessageAmbireWallet).isVisible()
    await this.page.locator(locators.openDashboardButton).click()
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
    await this.personalizeAccountName()
    // assertion on Dashboard after login
    await this.page.locator(locators.addMoreAccountsButton).isVisible()
    await this.page.locator(locators.completeButton).click()
    await this.page.locator(locators.confirmationMessageAmbireWallet).isVisible()
    await this.page.locator(locators.openDashboardButton).click()
  }

  async personalizeAccountName(): Promise<void> {
    await this.page.locator(locators.editAccountButton).click()
    // TODO: Parametrization
    await this.typeTextInInputField(locators.editAccountNameField, 'Name 1')
    await this.page.locator(locators.saveMessageText).isVisible()
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
    await this.page.locator(locators.confirmationMessageForViewOnly).isVisible()
    await this.personalizeAccountName()
    await this.page.locator(locators.completeButton).click()
    await this.page.locator(locators.confirmationMessageAmbireWallet).isVisible()
    await this.page.locator(locators.openDashboardButton).click()
  }

  async createNewHotWalletAndPersonalizeName(): Promise<void> {
    await this.page.locator(locators.createNewAccountButton).click()
    for (let index = 0; index < 3; index++) {
      // eslint-disable-next-line no-await-in-loop
      await this.page.locator(`div[data-testid="checkbox"] >> nth = ${index}`).click()
    }
    await this.page.locator(locators.createRecoveryPhraseButton).click()
    await this.verifyRecoveryPhraseScreen()
    await this.setExtensionPassword()
    await this.page.locator(locators.addMoreAccountsButton).click()
    await this.page.locator(locators.smartAccountPicker).click()
    await this.page.locator(locators.importAccountButton).click()
    await this.page.locator(locators.confirmationMessageForViewOnly).isVisible()
    await this.personalizeAccountName()
    await this.page.locator(locators.addMoreAccountsButton).isVisible()
    await this.page.locator(locators.completeButton).click()
    await this.page.locator(locators.confirmationMessageAmbireWallet).isVisible()
    await this.page.locator(locators.openDashboardButton).click()
  }

  async selectHDPath(path: string): Promise<void> {
    await this.page.locator(locators.changeHDPathButton).click()
    await this.page.locator(path).click()
    await this.page.locator(locators.hdPathConfirmButton).click()
  }

  async createAccountAndImportFromDifferentHDPath(): Promise<void> {
    await this.page.locator(locators.createNewAccountButton).click()
    for (let index = 0; index < 3; index++) {
      // eslint-disable-next-line no-await-in-loop
      await this.page.locator(`div[data-testid="checkbox"] >> nth = ${index}`).click()
    }
    await this.page.locator(locators.createRecoveryPhraseButton).click()
    await this.verifyRecoveryPhraseScreen()
    await this.setExtensionPassword()
    await this.page.locator(locators.addMoreAccountsButton).click()
    await this.selectHDPath(locators.hdPathLegerLive)
    await this.page.locator(locators.smartAccountPicker).click()
    await this.page.locator(locators.importAccountButton).click()
    await this.page.locator(locators.confirmationMessageForViewOnly).isVisible()
    await this.page.locator(locators.addMoreAccountsButton).click()
    await this.selectHDPath(locators.hdPathLegerLive)
    await this.page.locator(locators.smartAccountPickerForHDPath).click()
    await this.page.locator(locators.importAccountButton).click()
    await this.page.locator(locators.addMoreAccountsButton).isVisible()
    await this.page.locator(locators.completeButton).click()
    await this.page.locator(locators.confirmationMessageAmbireWallet).isVisible()
    await this.page.locator(locators.openDashboardButton).click()
  }

  // TODO: imporove method assertions
  async importAccountFromJSONFile(): Promise<void> {
    const saAccounts = JSON.parse(process.env.SA_ACCOUNT_JSON || '{}')
    const jsonBuffer = Buffer.from(JSON.stringify(saAccounts))
    // await this.page.locator(locators.importExistingAccountButton).click()
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
    await this.page.locator(locators.completeButton).click()
    await this.page.locator(locators.confirmationMessageAmbireWallet).isVisible()
    await this.page.locator(locators.openDashboardButton).click()
  }
}
