import { KEYSTORE_PASS, PRIVATE_KEY } from 'constants/env'
import mainConstants from 'constants/mainConstants'
import selectors from 'constants/selectors'
import tokens from 'constants/tokens'

import { expect, test } from '../../fixtures/pageObjects'
import { resetAppToCleanState } from '../../utils/resetDevice'

test.describe('transfer', { tag: '@transfer-mobile' }, () => {
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
      // same PRIVATE_KEY/BA_ADDRESS fixture desktop uses for its own spend-based transfer tests.
      await pages.auth.importExistingAccountWithPrivateKey(PRIVATE_KEY, KEYSTORE_PASS)
      await expect(screen.getByTestId(selectors.accountSelectBtn)).toBeVisible()
    }
  )

  test('should send a transaction and pay with the current account gas tank', async ({ pages }) => {
    const sendToken = tokens.usdc.optimism
    const recipientAddress = mainConstants.addresses.smartAccount
    const message = 'Transfer done!'

    await test.step('assert no transaction on Activity tab', async () => {
      await pages.dashboard.checkNoTransactionOnActivityTab()
    })

    await test.step('start send transfer', async () => {
      await pages.dashboard.navigateToTransfer()
    })

    await test.step('add transfer amount', async () => {
      await pages.transfer.fillAmount(sendToken)
    })

    await test.step('add recipient address', async () => {
      await pages.transfer.fillRecipient(recipientAddress)
    })

    let signed = false
    await test.step('send transaction', async () => {
      signed = await pages.transfer.signSlowSpeedTransaction({ message })
    })

    // When the fee is above the $0.10 test limit, signSlowSpeedTransaction skips signing on
    // purpose. Nothing was broadcasted, so skip the test instead of failing the assertion below.
    test.skip(!signed, 'Transaction fee exceeded the $0.10 limit; signing was skipped.')

    await test.step('assert new transaction on Activity tab', async () => {
      await pages.dashboard.checkSendTransactionOnActivityTab('Send')
    })
  })
})
