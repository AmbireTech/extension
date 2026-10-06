import { KEYSTORE_PASS, PRIVATE_KEY } from 'constants/env'
import selectors from 'constants/selectors'
import tokens from 'constants/tokens'

import { expect, test } from '../../fixtures/pageObjects'
import { resetAppToCleanState } from '../../utils/resetDevice'

test.describe('gasTank - Basic Account', { tag: '@gasTank-mobile' }, () => {
  test.setTimeout(180000)

  test.beforeEach(
    'Reset app and import a signing-capable account',
    async ({ screen, device, bundleId, pages }, testInfo) => {
      await resetAppToCleanState({
        screen,
        device,
        bundleId,
        projectName: testInfo.project.name
      })

      // Mobile has no storage-injection shortcut (desktop's initWithStorage), so the
      // signing-capable account is imported for real through the onboarding UI. Reuses the
      // same PRIVATE_KEY/BA_ADDRESS fixture desktop uses for its own spend-based tests.
      // Desktop tests gas tank against the Smart Account instead; doing the same on mobile
      // would require picking the Smart Account out of the post-import account picker, whose
      // exact mobile flow (desktop's `locators.smartAccountPicker` relies on a fragile
      // `nth=5` index into a dynamic list) hasn't been verified on a real device yet.
      await pages.auth.importExistingAccountWithPrivateKey(PRIVATE_KEY, KEYSTORE_PASS)
      await expect(screen.getByTestId(selectors.accountSelectBtn)).toBeVisible()
    }
  )

  test('should top up Gas Tank with 0.01 USDC on Base', async ({ pages }) => {
    const sendToken = tokens.usdc.base
    const message = 'Top up ready!'

    await test.step('assert no transaction on Activity tab', async () => {
      await pages.dashboard.checkNoTransactionOnActivityTab()
    })

    await test.step('top up gas tank', async () => {
      await pages.gasTank.topUpGasTank(sendToken, '0.01')
    })

    let signed = false
    await test.step('sign transaction', async () => {
      signed = await pages.transfer.signSlowSpeedTransaction({
        message,
        holdProceedButton: false
      })
    })

    // When the fee is above the $0.10 test limit, signSlowSpeedTransaction skips signing on
    // purpose. Nothing was broadcasted, so skip the test instead of failing the assertion below.
    test.skip(!signed, 'Transaction fee exceeded the $0.10 limit; signing was skipped.')

    await test.step('assert new transaction on Activity tab', async () => {
      await pages.dashboard.checkSendTransactionOnActivityTab('Fuel gas tank')
    })
  })
})
