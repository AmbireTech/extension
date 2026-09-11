import { KEYSTORE_PASS } from 'constants/env'
import selectors from 'constants/selectors'
import { ethers } from 'ethers'
import {
  BIOMETRICS_SECRET_BYTES,
  BIOMETRICS_WEBAUTHN_CREDENTIAL,
  EXPECTED_SEEDS,
  EXPORTABLE_KEYS,
  keystoreMigrationStorage
} from 'fixtures/keystoreMigration'

import { expect } from '@playwright/test'
import { SKIP_AUTO_BIOMETRICS_PROMPT_ONCE } from '../../../../src/web/modules/keystore/constants'

import { test } from '../../../fixtures/pageObjects'

const PASSWORD_UNLOCK_REQUIRED_NOTICE =
  'Enter your password to finish a security update. Biometric unlock will be available right after.'

// Reads the (possibly stringified) keystore blobs from the service worker.
const readKeystore = (pages: any) =>
  pages.serviceWorker.evaluate(() =>
    chrome.storage.local.get(['keystoreSecrets', 'keystoreKeys', 'keystoreSeeds'])
  )

const parseMaybe = (value: any) => (typeof value === 'string' ? JSON.parse(value) : value)

// Asserts every stored key privKey and every seed/seedPassphrase has been re-encrypted to GCM
// (i.e. is an object with cipherType 'AES-GCM', not a legacy AES-CTR hex string).
const expectKeysAndSeedsGcm = (data: any) => {
  const keys: any[] = parseMaybe(data.keystoreKeys)
  for (const key of keys) {
    if (key.privKey === null || key.privKey === undefined) continue
    if (typeof key.privKey === 'string') throw new Error(`Key ${key.addr} not yet migrated`)
    expect(key.privKey.cipherType).toBe('AES-GCM')
  }

  const seeds: any[] = parseMaybe(data.keystoreSeeds)
  for (const seed of seeds) {
    if (!seed.seed) continue
    if (typeof seed.seed === 'string') throw new Error(`Seed ${seed.id} not yet migrated`)
    expect(seed.seed.cipherType).toBe('AES-GCM')
    if (!seed.seedPassphrase) continue
    if (typeof seed.seedPassphrase === 'string')
      throw new Error(`Seed passphrase ${seed.id} not yet migrated`)
    expect(seed.seedPassphrase.cipherType).toBe('AES-GCM')
  }
}

test.describe(
  'keystore AES-CTR → AES-GCM migration via biometrics',
  { tag: '@keystoreMigrationBiometrics' },
  () => {
    test.setTimeout(180000)

    test.beforeEach(async ({ pages }) => {
      await pages.initWithStorage(keystoreMigrationStorage, { shouldUnlockManually: true })

      // bootstrapWithStorage skips keystore fields when shouldUnlockManually=true — write them
      // now, using the secrets blob that contains BOTH a password and a biometrics secret (both
      // legacy AES-CTR). Seed the stored WebAuthn credential so getSecret() proceeds to call the
      // (stubbed) navigator.credentials.get.
      await pages.serviceWorker.evaluate((params: any) => chrome.storage.local.set(params), {
        keyStoreUid: keystoreMigrationStorage.parsedKeystoreUID,
        keystoreKeys: keystoreMigrationStorage.parsedKeystoreKeys,
        keystoreSecrets: keystoreMigrationStorage.parsedKeystoreSecrets,
        keystoreSeeds: keystoreMigrationStorage.parsedKeystoreSeeds,
        biometricsWebAuthnCredential: JSON.stringify(BIOMETRICS_WEBAUTHN_CREDENTIAL)
      })

      // Stub the WebAuthn boundary (real biometrics can't run headless). Registered before the
      // upcoming navigation so it is in place when the unlock screen mounts. The stub:
      //  - reports a platform authenticator is available (drives hasBiometricsHardware = true);
      //  - returns a fixed PRF output so getBiometricsSecret() === BIOMETRICS_SECRET_HEX, which
      //    decrypts the baked biometrics secret.
      await pages.basePage.page.addInitScript((bytes: number[]) => {
        const w = window as any
        if (typeof w.PublicKeyCredential === 'undefined') w.PublicKeyCredential = function () {}
        w.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable = async () => true

        if (!navigator.credentials) {
          Object.defineProperty(navigator, 'credentials', { value: {}, configurable: true })
        }
        ;(navigator.credentials as any).get = async () => ({
          type: 'public-key',
          rawId: new Uint8Array(bytes),
          getClientExtensionResults: () => ({
            prf: { results: { first: new Uint8Array(bytes) } }
          })
        })
      }, BIOMETRICS_SECRET_BYTES)

      await pages.basePage.navigateToURL(`${pages.extensionURL}/tab.html#/`)
    })

    test.afterEach(async ({ context }) => {
      await context.close()
    })

    test('password unlock migrates first, biometrics unlock migrates its own secret after', async ({
      pages
    }) => {
      // --- 1. Biometrics is not offered while the password secret is still on AES-CTR: a secret
      // migrates only when it is used to unlock, so the password one must go first. ---
      await expect(pages.basePage.page.getByText(PASSWORD_UNLOCK_REQUIRED_NOTICE)).toBeVisible()
      await pages.basePage.expectElementNotVisible(selectors.buttonUnlockBiometricsIcon)

      // --- 2. Unlock with the password ---
      await pages.basePage.entertext(selectors.passphraseField, KEYSTORE_PASS)
      await pages.basePage.click(selectors.buttonUnlock)
      await pages.basePage.expectElementVisible(selectors.fullBalance)
      await expect(pages.basePage.page).toHaveURL(/\/dashboard/)
      await expect(pages.basePage.page.getByText('Error').first()).not.toBeVisible()

      // --- 3. Assert lazy per-secret migration: password secret + keys + seeds are now GCM,
      // but the biometrics secret is still AES-CTR (it migrates only when used to unlock). ---
      await expect(async () => {
        const data: any = await readKeystore(pages)

        const secrets = JSON.parse(data.keystoreSecrets)
        const passwordSecret = secrets.find((s: any) => s.id === 'password')
        const biometricsSecret = secrets.find((s: any) => s.id === 'biometrics')
        expect(passwordSecret?.aesEncrypted?.cipherType).toBe('AES-GCM')
        expect(biometricsSecret?.aesEncrypted?.cipherType).toBe('aes-128-ctr')

        expectKeysAndSeedsGcm(data)
      }).toPass({ timeout: 30000 })

      // Skip the auto-prompt on the next unlock screen mount, so the biometrics ceremony is
      // triggered by an explicit click (deterministic). Locking from settings doesn't set the
      // flag itself, unlike locking from the nav menu.
      await pages.basePage.page.evaluate(
        (key: string) => sessionStorage.setItem(key, 'true'),
        SKIP_AUTO_BIOMETRICS_PROMPT_ONCE
      )

      // --- 4. Lock, then unlock with biometrics, which is offered again now that the password
      // secret is migrated (exercising the GCM-migration path for the biometrics secret). ---
      await pages.settings.lockKeystore()
      await pages.basePage.expectElementVisible(selectors.buttonUnlockBiometricsIcon)
      await pages.basePage.click(selectors.buttonUnlockBiometricsIcon)
      await pages.basePage.expectElementVisible(selectors.fullBalance)

      // --- 5. Data is still valid after the biometrics unlock: all seeds reveal correctly and the
      // internal private keys export and re-derive to their addresses. ---
      await pages.recoveryPhrases.open()
      const expectedIds = Object.keys(EXPECTED_SEEDS)
      expect(await pages.recoveryPhrases.getSeedCount()).toBe(expectedIds.length)
      for (const [seedId, expected] of Object.entries(EXPECTED_SEEDS)) {
        const { phrase, passphrase } = await pages.recoveryPhrases.revealSeed(seedId)
        expect(phrase).toBe(expected.seed)
        if (expected.passPhrase) expect(passphrase).toBe(expected.passPhrase)
        else expect(passphrase).toBeNull()
      }

      for (const key of EXPORTABLE_KEYS) {
        const privateKey = await pages.accountKeys.exportPrivateKey(key.addr, key.accountAddr)
        expect(ethers.computeAddress(privateKey).toLowerCase()).toBe(key.addr.toLowerCase())
      }

      // --- 6. Read storage: the biometrics secret is now GCM too → everything is GCM. ---
      await expect(async () => {
        const data: any = await readKeystore(pages)
        const secrets = JSON.parse(data.keystoreSecrets)
        for (const secret of secrets) {
          expect(secret.aesEncrypted.cipherType).toBe('AES-GCM')
        }
        expectKeysAndSeedsGcm(data)
      }).toPass({ timeout: 30000 })
    })
  }
)
