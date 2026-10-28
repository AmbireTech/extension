import { KEYSTORE_PASS } from 'constants/env'
import mainConstants from 'constants/mainConstants'
import selectors from 'constants/selectors'

import { expect, test } from '../../fixtures/pageObjects'
import { resetAppToCleanState } from '../../utils/resetDevice'

test.describe('auth', { tag: '@auth-mobile' }, () => {
  test.beforeEach('Reset app to a clean state', async ({ screen, device, bundleId }, testInfo) => {
    await resetAppToCleanState({
      screen,
      device,
      bundleId,
      projectName: testInfo.project.name
    })
  })

  test('should import view-only Basic account', async ({ screen, pages }) => {
    await test.step('select import view-only option', async () => {
      await screen.getByTestId(selectors.getStarted.importExistingAccBtn).tap()
      await screen.getByTestId(selectors.getStarted.importMethodWatchAddress).tap()
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
