import { BA_PASSPHRASE, SA_PASSPHRASE } from 'constants/env'
import mainConstants from 'constants/mainConstants'
import { test } from 'fixtures/pageObjects' // your extended test with authPage

test.describe.parallel('auth', () => {
  test.beforeEach(async ({ authPage }) => {
    await authPage.init()
  })

  test('should import view-only Basic account', async ({ authPage }) => {
    await authPage.importViewOnlyAccount(mainConstants.addresses.basicAccount)
  })

  test('should import view-only Smart account', async ({ authPage }) => {
    await authPage.importViewOnlyAccount(mainConstants.addresses.smartAccount)
  })

  test('create new basic account', async ({ authPage }) => {
    await authPage.createNewAccount()
  })

  test('import basic account from private key', async ({ authPage }) => {
    await authPage.importExistingAccount()
  })

  test('import one Basic Account from a 12 words seed phrase and personalize them', async ({
    authPage
  }) => {
    await authPage.importExistingAccountByRecoveryPhrase(BA_PASSPHRASE)
  })

  test('import one Smart Account from a 12 words seed phrase and personalize them', async ({
    authPage
  }) => {
    await authPage.importExistingAccountByRecoveryPhrase(SA_PASSPHRASE)
  })

  test('import a couple of view-only accounts (at once) and personalize some of them', async ({
    authPage
  }) => {
    await authPage.importCoupleOfViewOnlyAccount(
      mainConstants.addresses.basicAccount,
      mainConstants.addresses.smartAccount
    )
  })

  test('create a new hot wallet (Smart Account) by setting up a default seed phrase first, and afterward create a couple of more hot wallets (Smart Accounts) out of the stored seed phrase and personalize some of them', async ({
    authPage
  }) => {
    await authPage.createNewHotWalletAndPersonalizeName()
  })

  test('import account from different HD paths', async ({ authPage }) => {
    await authPage.createAccountAndImportFromDifferentHDPath()
  })

  test('import account from JSON file', async ({ authPage }) => {
    await authPage.importAccountFromJSONFile()
  })
})
