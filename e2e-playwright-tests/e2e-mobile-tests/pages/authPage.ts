import selectors from 'constants/selectors'

import { expect } from '@mobilewright/test'

import { BasePageMobile } from './basePage'

export class AuthPage extends BasePageMobile {
  async setExtensionPassword(password: string): Promise<void> {
    await this.screen.getByTestId(selectors.getStarted.enterPassField).fill(password)
    await this.screen.getByTestId(selectors.getStarted.repeatPassField).fill(password)
    // await this.screen.getByRole('button', { name: 'Continue' }).tap()
    await this.screen.getByTestId(selectors.getStarted.createKeystorePassBtn).tap()
  }

  /**
   * Imports a signing-capable Basic Account via a raw private key, through the real onboarding
   * UI. Mobile has no equivalent of the desktop suite's `initWithStorage` (which injects a
   * pre-funded keystore straight into browser storage), so any mobile test that needs to sign
   * and broadcast a real transaction (transfer, gas tank top-up, swap & bridge) has to onboard
   * for real with a funded key first. Reuses the same `PRIVATE_KEY` test fixture the desktop
   * suite already uses for this exact account (see constants/env.ts and desktop's
   * pages/authPage.ts#importExistingAccount), so it resolves to the same `BA_ADDRESS` account.
   */
  async importExistingAccountWithPrivateKey(privateKey: string, password: string): Promise<void> {
    await this.screen.getByTestId(selectors.getStarted.importExistingAccBtn).tap()
    await this.screen.getByTestId(selectors.getStarted.importMethodPrivateBtn).tap()
    await this.screen.getByTestId(selectors.getStarted.enterPrivateKeyField).fill(privateKey)
    await this.screen.getByTestId(selectors.getStarted.warningCheckbox).tap()
    await this.screen.getByTestId(selectors.getStarted.importBtn).tap()

    await this.setExtensionPassword(password)

    await expect(this.screen.getByRole('text', { name: 'Added successfully' })).toBeVisible()
    await this.screen.getByTestId(selectors.getStarted.saveAndContinueBtn).tap()
  }
}
