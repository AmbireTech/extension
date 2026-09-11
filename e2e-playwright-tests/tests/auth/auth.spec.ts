import { KEYSTORE_PASS } from 'constants/env'
import mainConstants from 'constants/mainConstants'
import selectors from 'constants/selectors'
import { computeAddress, HDNodeWallet } from 'ethers'
import { test } from 'fixtures/pageObjects' // your extended test with auth

import { expect } from '@playwright/test'

import { emulatorOptions } from '../../constants/trezor'
import {
  disposeTrezorConnect,
  getController,
  initTrezorConnect,
  setup
} from '../../utils/trezorEmulator'

test.describe('auth', { tag: '@auth' }, () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ pages }) => {
    await pages.initWithoutStorage()
  })

  test.afterEach(async ({ context }) => {
    await context.close()
  })

  test('should import view-only Basic account', async ({ pages }) => {
    await pages.auth.importViewOnlyAccount(mainConstants.addresses.basicAccount)
  })

  test('should import view-only Smart account', async ({ pages }) => {
    await pages.auth.importViewOnlyAccount(mainConstants.addresses.smartAccount)
  })

  test('create new basic account', async ({ pages }) => {
    await pages.auth.createNewAccount()
  })

  test('import basic account from private key', async ({ pages }) => {
    await pages.auth.importExistingAccount()
  })

  // The zero-entropy BIP39 test vector is eleven "abandon" words followed by "about".
  const seed = [...Array(11).fill('abandon'), 'about'].join(' ')
  const seedInputs = [
    { name: 'full words without a passphrase', seed, passphrase: undefined },
    {
      name: 'mixed words and prefixes with a passphrase',
      seed: 'aban aband abando abandon aban aband abando abandon aban aband abando abou',
      // Passphrase case, spaces and BIP39-like fragments must remain unchanged.
      passphrase: '  Aban  abou MiXeD!  '
    }
  ]

  for (const input of seedInputs) {
    test(`import recovery phrase using ${input.name}`, async ({ pages }) => {
      const expectedAddress = HDNodeWallet.fromPhrase(seed, input.passphrase).address

      await pages.auth.importExistingAccountByRecoveryPhrase(input.seed, input.passphrase)

      // Opening settings reloads the dashboard, so these checks also cover the saved seed.
      await pages.recoveryPhrases.open()
      const seedId = await pages.recoveryPhrases.getFirstSeedId()
      const restored = await pages.recoveryPhrases.revealSeed(seedId)
      // Compare secrets as booleans to keep them out of assertion failure output.
      expect(restored.phrase === seed).toBe(true)
      expect(restored.passphrase === (input.passphrase || null)).toBe(true)

      const privateKey = await pages.accountKeys.exportPrivateKey(expectedAddress, expectedAddress)
      expect(computeAddress(privateKey)).toBe(expectedAddress)
    })
  }

  test('rejects recovery phrase typos and invalid checksums, then accepts corrected fragments', async ({
    pages
  }) => {
    await pages.auth.click(selectors.getStarted.importExistingAccBtn)
    await pages.auth.click(selectors.getStarted.importMethodRecoveryPhrase)
    const input = pages.auth.page.getByTestId(selectors.getStarted.enterSeedPhraseField)
    const confirm = pages.auth.page.getByTestId(selectors.getStarted.importBtn)

    await input.fill(['abandox', ...Array(10).fill('aban'), 'abou'].join(' '))
    await expect(confirm).toHaveAttribute('aria-disabled', 'true')

    await input.fill(Array(12).fill('abandon').join(' '))
    await expect(confirm).toHaveAttribute('aria-disabled', 'true')

    await input.fill([...Array(11).fill('aban'), 'abou'].join(' '))
    await expect(confirm).not.toHaveAttribute('aria-disabled', 'true')
  })

  test('import a couple of view-only accounts (at once) and personalize some of them', async ({
    pages
  }) => {
    await pages.auth.importCoupleOfViewOnlyAccount(
      mainConstants.addresses.basicAccount,
      mainConstants.addresses.smartAccount
    )
  })

  test('create a new hot wallet (Smart Account) by setting up a default seed phrase first, and afterward create a couple of more hot wallets (Smart Accounts) out of the stored seed phrase and personalize some of them', async ({
    pages
  }) => {
    await pages.auth.createNewHotWalletAndPersonalizeName()
  })

  test('import account from different HD paths', async ({ pages }) => {
    test.setTimeout(80000)

    await pages.auth.createAccountAndImportFromDifferentHDPath()
  })

  test('import account from JSON file', async ({ pages }) => {
    await pages.auth.importAccountFromJSONFile()
  })
})

test.describe('trezor', { tag: '@trezorTests' }, () => {
  test.describe.configure({ mode: 'serial' })
  const controller = getController()

  test.beforeEach(async ({ pages }) => {
    await setup(controller, emulatorOptions)
    await initTrezorConnect(controller)
    await pages.initWithoutStorage()
    await pages.basePage.closeDuplicateExtensionTabs()
  })

  test.afterEach(async ({ context }) => {
    // Cleanup emulator and dispose of resources
    try {
      if (controller.ws && controller.ws.readyState === WebSocket.OPEN) {
        await controller.api.wipeEmu()
        await controller.api.stopBridge()
        await controller.api.stopEmu()
      } else {
        console.warn('TrezorUserEnvLink WS already disconnected. Skipping emulator cleanup.')
      }
    } catch (error) {
      console.error('Error during cleanup:', error)
    } finally {
      disposeTrezorConnect()
      controller.dispose()
    }
    await context.close()
  })

  test('should successfully authenticate using Trezor and import existing accounts', async ({
    pages
  }) => {
    const page = pages.auth.page

    await test.step('start importing existing Trezor accounts in our Onboarding flow', async () => {
      await page.getByTestId(selectors.getStarted.importExistingAccBtn).click()
      await page.getByTestId(selectors.importMethodTrezor).click()

      await page.getByTestId(selectors.getStarted.enterPassField).fill(KEYSTORE_PASS)
      await page.getByTestId(selectors.getStarted.repeatPassField).fill(KEYSTORE_PASS)
    })

    await test.step('allow importing accounts from Trezor Connect', async () => {
      const trezorPage = await pages.auth.handleNewPage(
        page.getByTestId(selectors.getStarted.createKeystorePassBtn)
      )

      await trezorPage.content()

      // When the test is run in Chromium (in CI),
      // the Trezor page shows a "browser not supported" warning, which we need to explicitly confirm.
      // When running in headed mode (--ui or --debug flags enabled in Playwright),
      // this dialog doesn't appear, so we conditionally click it.
      const locator = trezorPage.getByRole('button', { name: /I acknowledge and wish to/i })
      await page.waitForTimeout(5000)
      if (await locator.isVisible()) {
        await locator.click()
      }

      // Confirm Trezor Terms dialog
      await trezorPage.getByTestId(selectors.trezorConnectConfirmTerms).click()

      await trezorPage.locator('button.list .wrapper .device-name').click()
      await trezorPage.getByRole('button', { name: 'Allow once for this session' }).click()
      await trezorPage.getByRole('button', { name: 'Export' }).click()
    })

    await test.step('import first 2 accounts', async () => {
      await page.waitForTimeout(2000)
      const firstTrezorAccount = page.getByTestId(
        `add-account-${mainConstants.addresses.trezorAccount1}`
      )
      await expect(firstTrezorAccount).toBeVisible({ timeout: 10000 })
      await firstTrezorAccount.click()
      await page.getByTestId(`add-account-${mainConstants.addresses.trezorAccount2}`).click()
      await page.getByTestId(selectors.getStarted.importAccountButton).click()
      await page.getByTestId(selectors.getStarted.saveAndContinueBtn).click()
    })

    await test.step('make sure accounts are imported', async () => {
      await pages.auth.goToDashboard()

      // For some reason, the account select button is not visible in some of the runs,
      // so we add a small wait to give the button a chance to be visible,
      // and log a diagnostic error if the button is not clickable in order to debug the issue.
      await page.waitForTimeout(5000)
      const accountSelectBtn = page.getByTestId(selectors.accountSelectBtn)

      const debugInfo = {
        testId: selectors.accountSelectBtn,
        currentUrl: page.url(),
        count: await accountSelectBtn.count(),
        isVisible: await accountSelectBtn.isVisible().catch(() => false),
        isEnabled: await accountSelectBtn.isEnabled().catch(() => false),
        viewport: page.viewportSize()
      }

      try {
        await accountSelectBtn.click()
      } catch (error) {
        const htmlOutput = (await page.content()).slice(0, 10000)
        console.error('Failed to find/click account selector button', {
          ...debugInfo,
          postClickVisible: await accountSelectBtn.isVisible().catch(() => false),
          postClickEnabled: await accountSelectBtn.isEnabled().catch(() => false),
          htmlOutput
        })

        throw error
      }

      const partAddress1 = mainConstants.addresses.trezorAccount1.slice(0, 10)
      const partAddress2 = mainConstants.addresses.trezorAccount2.slice(0, 10)

      await expect(page.getByText(partAddress1)).toBeVisible()
      await expect(page.getByText(partAddress2)).toBeVisible()
    })
  })
})
