import mainConstants from 'constants/mainConstants'
import selectors from 'constants/selectors'

import { BasePageMobile } from './basePage'

export class AuthPage extends BasePageMobile {
  async setExtensionPassword(password: string): Promise<void> {
    // await this.screen.getByTestId(selectors.getStarted.passwordInput).fill(password)
    // await this.screen.getByTestId(selectors.auth.confirmPasswordInput).fill(password)
    // await this.screen.getByRole('button', { name: 'Continue' }).tap()
  }
}
