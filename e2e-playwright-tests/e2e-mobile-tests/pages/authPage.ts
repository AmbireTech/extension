import selectors from 'constants/selectors'

import { BasePageMobile } from './basePage'

export class AuthPage extends BasePageMobile {
  async setExtensionPassword(password: string): Promise<void> {
    await this.screen.getByTestId(selectors.getStarted.enterPassField).fill(password)
    await this.screen.getByTestId(selectors.getStarted.repeatPassField).fill(password)
    // await this.screen.getByRole('button', { name: 'Continue' }).tap()
    await this.screen.getByTestId(selectors.getStarted.createKeystorePassBtn).tap()
  }
}
