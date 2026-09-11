import { execSync } from 'child_process'
import { KEYSTORE_PASS } from 'constants/env'
import mainConstants from 'constants/mainConstants'
import selectors from 'constants/selectors'

import { expect, test } from '../../fixtures/pageObjects'

const BUNDLE_ID = 'com.ambire.wallet'

test.describe('auth', { tag: '@auth-mobile' }, () => {
  test.beforeEach('Reset app to a clean state', async ({ screen, device }, testInfo) => {
    if (testInfo.project.name === 'android') {
      // `pm clear` wipes all app data and force-stops it; relaunch for a clean start.
      execSync(`adb shell pm clear ${BUNDLE_ID}`)
      await device.launchApp(BUNDLE_ID)

      // A system dialog can appear right after clearing data — dismiss it if present.
      const systemDialogOkButton = screen.getByTestId('android:id/button1')
      if (await systemDialogOkButton.count()) await systemDialogOkButton.tap()
    }

    if (testInfo.project.name === 'ios') {
      // The simulator has no `pm clear` equivalent, so reinstall to reset state.
      await device.uninstallApp(BUNDLE_ID)
      await device.installApp('./Ambire-sim.zip')
      await device.launchApp(BUNDLE_ID)
    }
  })

  test('should import view-only Basic account', async ({ screen, pages }) => {
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
      await pages.auth.setExtensionPassword(KEYSTORE_PASS)
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
