import { PRIVATE_KEY } from 'constants/env'
import { ethers } from 'ethers'

import { test } from '../../../fixtures/pageObjects'

test.describe('private key export', { tag: '@keystore' }, () => {
  test.beforeEach(async ({ pages }) => {
    await pages.initWithoutStorage()
    await Promise.all(
      pages.auth.context
        .pages()
        .filter((page) => page !== pages.auth.page)
        .map((page) => page.close())
    )
  })

  test.afterEach(async ({ context }) => {
    await context.close()
  })

  test('allows copying the private key while it remains hidden after authentication', async ({
    pages
  }) => {
    await pages.auth.importExistingAccount()

    const keyAddress = ethers.computeAddress(PRIVATE_KEY)
    await pages.accountKeys.exportPrivateKey(keyAddress, keyAddress)
  })
})
