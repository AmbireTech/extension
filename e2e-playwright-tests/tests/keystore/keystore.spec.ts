import { KEYSTORE_PASS, saParams } from 'constants/env'

import { test } from '../../fixtures/pageObjects'

test.describe('keystore', () => {
  test.beforeEach(async ({ settingsPage }) => {
    await settingsPage.init(saParams)
  })

  test('should lock keystore', async ({ settingsPage }) => {
    await settingsPage.lockKeystore()
  })

  test('should unlock keystore', async ({ settingsPage }) => {
    await settingsPage.unlockKeystore()
  })

  test('should change keystore password', async ({ settingsPage }) => {
    const newPass = 'B1234566'

    await test.step('go to Extension pass page', async () => {
      await settingsPage.openExtensionPassword()
    })
    await test.step('change current password', async () => {
      await settingsPage.changeKeystorePassword(KEYSTORE_PASS, newPass)
    })
  })
})
