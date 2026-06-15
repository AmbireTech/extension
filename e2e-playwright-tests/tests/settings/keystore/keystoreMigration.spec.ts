import { KEYSTORE_PASS } from 'constants/env'
import selectors from 'constants/selectors'
import { ethers } from 'ethers'
import {
  EXPECTED_SEEDS,
  EXPORTABLE_KEYS,
  keystoreMigrationStorage,
  NON_EXPORTABLE_KEYS
} from 'fixtures/keystoreMigration'

import { expect } from '@playwright/test'

import { test } from '../../../fixtures/pageObjects'

test.describe('keystore AES-CTR → AES-GCM migration', { tag: '@keystoreMigration' }, () => {
  test.setTimeout(180000)

  test.beforeEach(async ({ pages }) => {
    await pages.initWithStorage(keystoreMigrationStorage, { shouldUnlockManually: true })

    // bootstrapWithStorage skips keystore fields when shouldUnlockManually=true — write them now
    await pages.serviceWorker.evaluate((params: any) => chrome.storage.local.set(params), {
      keyStoreUid: keystoreMigrationStorage.parsedKeystoreUID,
      keystoreKeys: keystoreMigrationStorage.parsedKeystoreKeys,
      keystoreSecrets: keystoreMigrationStorage.parsedKeystoreSecrets,
      keystoreSeeds: keystoreMigrationStorage.parsedKeystoreSeeds
    })

    await pages.basePage.navigateToURL(`${pages.extensionURL}/tab.html#/`)
    await pages.basePage.entertext(selectors.passphraseField, KEYSTORE_PASS)
    await pages.basePage.click(selectors.buttonUnlock)
    await pages.basePage.expectElementVisible(selectors.fullBalance)
  })

  test.afterEach(async ({ context }) => {
    await context.close()
  })

  test('unlocks to dashboard, no error toast', async ({ pages }) => {
    await expect(pages.basePage.page).toHaveURL(/\/dashboard/)
    await expect(pages.basePage.page.getByTestId(selectors.fullBalance)).toBeVisible()
    await expect(pages.basePage.page.getByText('Error').first()).not.toBeVisible()
  })

  test('migration re-encrypted everything to AES-GCM', async ({ pages }) => {
    // Poll until the controller finishes persisting the migrated keystore
    await expect(async () => {
      const data: any = await pages.serviceWorker.evaluate(() =>
        chrome.storage.local.get(['keystoreSecrets', 'keystoreKeys', 'keystoreSeeds'])
      )

      const secrets = JSON.parse(data.keystoreSecrets)
      const passwordSecret = secrets.find((s: any) => s.id === 'password')
      expect(passwordSecret?.aesEncrypted?.cipherType).toBe('AES-GCM')

      const keys: any[] =
        typeof data.keystoreKeys === 'string' ? JSON.parse(data.keystoreKeys) : data.keystoreKeys
      for (const key of keys) {
        if (key.privKey === null || key.privKey === undefined) continue
        // Internal keys should have been migrated from hex string to GCM object
        if (typeof key.privKey === 'string') throw new Error(`Key ${key.addr} not yet migrated`)
        expect(key.privKey.cipherType).toBe('AES-GCM')
      }

      const seeds: any[] =
        typeof data.keystoreSeeds === 'string' ? JSON.parse(data.keystoreSeeds) : data.keystoreSeeds
      for (const seed of seeds) {
        if (!seed.seed) continue
        if (typeof seed.seed === 'string') throw new Error(`Seed ${seed.id} not yet migrated`)
        expect(seed.seed.cipherType).toBe('AES-GCM')
        if (!seed.seedPassphrase) continue
        if (typeof seed.seedPassphrase === 'string')
          throw new Error(`Seed passphrase ${seed.id} not yet migrated`)
        expect(seed.seedPassphrase.cipherType).toBe('AES-GCM')
      }
    }).toPass({ timeout: 30000 })
  })

  test('all seeds reveal correctly', async ({ pages }) => {
    await pages.recoveryPhrases.open()

    const expectedIds = Object.keys(EXPECTED_SEEDS)
    const actualCount = await pages.recoveryPhrases.getSeedCount()
    expect(actualCount).toBe(expectedIds.length)

    for (const [seedId, expected] of Object.entries(EXPECTED_SEEDS)) {
      const { phrase, passphrase } = await pages.recoveryPhrases.revealSeed(seedId)
      expect(phrase).toBe(expected.seed)
      if (expected.passPhrase) {
        expect(passphrase).toBe(expected.passPhrase)
      } else {
        expect(passphrase).toBeNull()
      }
    }
  })

  test('internal PKs export correctly; HW keys not exportable', async ({ pages }) => {
    for (const key of EXPORTABLE_KEYS) {
      const privateKey = await pages.accountKeys.exportPrivateKey(key.addr, key.accountAddr)
      // The migrated (AES-GCM re-encrypted) key still decrypts to a private key that derives
      // back to its address — proving the re-encrypted material is intact and usable
      expect(ethers.computeAddress(privateKey).toLowerCase()).toBe(key.addr.toLowerCase())
    }

    for (const key of NON_EXPORTABLE_KEYS) {
      await pages.accountKeys.assertExportDisabled(key.addr, key.accountAddr)
    }
  })

  test('signs plain message with migrated key', async ({ pages }) => {
    const signerAddr = keystoreMigrationStorage.envSelectedAccount

    await pages.signMessage.signMessage('Hello keystore migration', 'plain', undefined, signerAddr)
  })

  test('signs typed-data (EIP-712) message with migrated key', async ({ pages }) => {
    const signerAddr = keystoreMigrationStorage.envSelectedAccount
    const typedData = JSON.stringify({
      domain: { name: 'Keystore Migration', version: '1', chainId: 1 },
      types: { TestData: [{ name: 'content', type: 'string' }] },
      message: { content: 'keystore migration e2e' },
      primaryType: 'TestData'
    })

    await pages.signMessage.signMessage(typedData, 'typed', undefined, signerAddr)
  })

  test('lock → re-unlock exercises GCM path', async ({ pages }) => {
    await pages.settings.lockKeystore()
    await pages.basePage.entertext(selectors.passphraseField, KEYSTORE_PASS)
    await pages.basePage.click(selectors.buttonUnlock)
    await pages.basePage.expectElementVisible(selectors.fullBalance)
  })

  test('wrong password is rejected', async ({ pages }) => {
    await pages.settings.lockKeystore()
    await pages.basePage.entertext(selectors.passphraseField, 'Wr0ngP@ssword!')
    await pages.basePage.click(selectors.buttonUnlock)
    await expect(pages.basePage.page).toHaveURL(/\/unlock/)
  })
})
