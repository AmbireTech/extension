import { KEYSTORE_PASS } from 'constants/env'
import mainConstants from 'constants/mainConstants'
import selectors from 'constants/selectors'

import { expect, test } from '../../fixtures/pageObjects'
import { resetAppToCleanState } from '../../utils/resetDevice'

test.describe('add account', { tag: '@addAccount-mobile' }, () => {
  test.beforeEach(
    'Reset app and import a first (view-only) account',
    async ({ screen, device, bundleId, pages }, testInfo) => {
      await resetAppToCleanState({
        screen,
        device,
        bundleId,
        projectName: testInfo.project.name
      })

      // The first account only needs to be view-only here - this spec exercises adding a
      // *second* account from an already-onboarded app, not signing.
      await screen.getByTestId(selectors.settings.watchAnAddressButton).tap()
      await screen
        .getByTestId(selectors.getStarted.viewOnlyInputAddressField)
        .fill(mainConstants.addresses.basicAccount)
      await screen.getByTestId(selectors.getStarted.viewOnlyBtnImport).tap()
      await pages.auth.setExtensionPassword(KEYSTORE_PASS)
      await expect(screen.getByRole('text', { name: 'Added successfully' })).toBeVisible()
      await screen.getByTestId(selectors.getStarted.saveAndContinueBtn).tap()
      await expect(screen.getByTestId(selectors.accountSelectBtn)).toBeVisible()
    }
  )

  test('should import vitalik.eth as a second view-only account', async ({ screen, pages }) => {
    await test.step('open account select and start adding an account', async () => {
      await pages.dashboard.openAccountSelect()
      // Mobile's "Add account" entry point lives on the Account Select screen itself
      // (button-add-account), not behind a Settings page like desktop's addAccount.spec.
      await screen.getByTestId(selectors.buttonAddAccount).tap()
    })

    await test.step('import vitalik.eth', async () => {
      await screen.getByTestId(selectors.settings.watchAnAddressButton).tap()
      await screen.getByTestId(selectors.getStarted.viewOnlyInputAddressField).fill('vitalik.eth')
      await screen.getByTestId(selectors.getStarted.viewOnlyBtnImport).tap()
    })

    await test.step('assert account added successfully', async () => {
      await expect(screen.getByRole('text', { name: 'Added successfully' })).toBeVisible()
      await screen.getByTestId(selectors.getStarted.saveAndContinueBtn).tap()
    })

    await test.step('assert the new account is visible in the account list', async () => {
      await expect(screen.getByText('vitalik.eth')).toBeVisible()
    })
  })
})
