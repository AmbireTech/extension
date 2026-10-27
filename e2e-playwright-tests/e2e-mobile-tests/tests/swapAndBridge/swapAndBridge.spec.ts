import { KEYSTORE_PASS, PRIVATE_KEY } from 'constants/env'
import selectors from 'constants/selectors'
import tokens from 'constants/tokens'

import { expect, test } from '../../fixtures/pageObjects'
import { resetAppToCleanState } from '../../utils/resetDevice'

test.describe('swap & bridge - Basic Account', { tag: '@swapAndBridge-mobile' }, () => {
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
      // Desktop tests Swap & Bridge against the Smart Account instead; doing the same on mobile
      // would require picking the Smart Account out of the post-import account picker, whose
      // exact mobile flow hasn't been verified on a real device yet (see the same TODO in
      // gasTank.spec.ts).
      await pages.auth.importExistingAccountWithPrivateKey(PRIVATE_KEY, KEYSTORE_PASS)
      await expect(screen.getByTestId(selectors.accountSelectBtn)).toBeVisible()
    }
  )

  test('should bridge USDC from Base to Optimism', async ({ pages }) => {
    const sendToken = tokens.usdc.base
    const receiveToken = tokens.usdc.optimism
    // Success copy rotates across several titles on the shared sign-account-op component - keep
    // in sync with getSwapCompletedMessage.ts if this needs to assert a specific message.
    const message = 'Mission accomplished.'

    await test.step('assert no transaction on Activity tab', async () => {
      await pages.dashboard.checkNoTransactionOnActivityTab()
    })

    await test.step('prepare bridge transaction', async () => {
      await pages.swapAndBridge.prepareSwapAndBridge(0.01, sendToken, receiveToken)
    })

    // Bridge transactions sign inline through the same panel as Transfer (unlike same-chain
    // Swap, which queues and opens a separate pending-route screen - out of scope for this
    // basic pass), so the shared TransferPage signing helper is reused here too.
    let signed = false
    await test.step('sign transaction', async () => {
      signed = await pages.transfer.signSlowSpeedTransaction({
        message,
        holdProceedButton: false,
        awaitConfirmation: false
      })
    })

    test.skip(!signed, 'Transaction fee exceeded the $0.10 limit; signing was skipped.')

    await test.step('assert new transaction on Activity tab', async () => {
      await pages.dashboard.checkSendTransactionOnActivityTab('Swap')
    })
  })
})
