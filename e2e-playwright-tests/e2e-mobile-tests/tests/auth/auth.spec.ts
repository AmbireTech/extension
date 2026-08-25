import { execSync } from 'child_process'
import { KEYSTORE_PASS } from 'constants/env'
import mainConstants from 'constants/mainConstants'
import selectors from 'constants/selectors'

import { expect, test } from '@mobilewright/test'

test.describe('auth', { tag: '@auth-mobile' }, () => {
  test.beforeAll('Clear device state', async ({ screen }) => {
    console.log('Clear app state...')
    // reset app state for andoid
    execSync('adb shell pm clear com.ambire.wallet')
    // reset app state for ios
    // execSync(`xcrun simctl uninstall <device-udid> <bundleId>`)
    // execSync(`xcrun simctl install <device-udid> <path-to-.app>`)

    // close android pop-up
    await screen.getByTestId('android:id/button1').tap()
  })

  test.only('should import view-only Basic account', async ({ screen }) => {
    await test.step('select import view-only option', async () => {
      await screen.getByTestId(selectors.settings.watchAnAddressButton).tap()
    })
    await test.step('import address', async () => {
      await screen
        .getByTestId(selectors.getStarted.viewOnlyInputAddressField)
        .fill(mainConstants.addresses.basicAccount)
      await screen.getByTestId(selectors.getStarted.viewOnlyBtnImport).tap()
    })
    await test.step('set extension password', async () => {
      await screen.getByTestId(selectors.getStarted.enterPassField).fill(KEYSTORE_PASS)
      await screen.getByTestId(selectors.getStarted.repeatPassField).fill(KEYSTORE_PASS)
      await screen.getByTestId(selectors.getStarted.createKeystorePassBtn).tap()
    })
    await test.step('assert message and click complete', async () => {
      await expect(screen.getByRole('text', { name: 'Added successfully' })).toBeVisible()
      await screen.getByTestId(selectors.getStarted.saveAndContinueBtn).tap()
    })
    await test.step('assert account on dashboard', async () => {
      await expect(screen.getByTestId(selectors.accountSelectBtn)).toBeVisible()
    })
  })
})
