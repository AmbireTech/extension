/**
 * One-off, generator for the static biometrics fixture data consumed by
 * `keystoreMigrationBiometrics.spec.ts`. It is NOT run in CI — it exists so the baked
 * constants in `keystoreMigration.ts` are reproducible and reviewable.
 *
 * What it does:
 *  1. Reads the existing `password` secret from `keystoreMigration.ts` (legacy AES-CTR).
 *  2. Recovers the keystore main key by reversing `#unlockWithSecretOld`
 *     (see src/ambire-common/src/controllers/keystore/keystore.ts), using KEYSTORE_PASS.
 *  3. Encrypts that SAME main key under a known biometrics secret in the legacy AES-CTR
 *     format (mirroring `createSecretEntry` in keystore.gcm.test.ts), producing an
 *     `id:'biometrics'` secret entry.
 *  4. Prints the constants to paste into `keystoreMigration.ts`.
 *
 * The biometrics secret value, salt, iv and the dummy WebAuthn credential are FIXED below so
 * the output is deterministic. The main key is derived from the committed password secret, so
 * if KEYSTORE_PASS or the password secret ever changes, re-run this and update the constants.
 */
import aes from 'aes-js'
import dotenv from 'dotenv'
import { concat, getBytes, hexlify, keccak256, scryptSync, toUtf8Bytes } from 'ethers'
import fs from 'fs'
import path from 'path'

// Mirrors keystore lib constants/helpers (kept local so this script has no repo-internal deps).
const SCRYPT_PARAMS = { N: 131072, r: 8, p: 1, dkLen: 64 }
const CIPHER_OLD = 'aes-128-ctr'
const getBytesForSecret = (secret: string) => toUtf8Bytes(secret, 'NFKC')

// --- Fixed inputs that define the biometrics secret (deterministic output) ----------------
// 32 raw bytes. `BIOMETRICS_SECRET_HEX = hexlify(B)` is the exact string `getBiometricsSecret()`
// returns at runtime (the stubbed WebAuthn PRF output), so the spec's WebAuthn mock must emit B.
const BIOMETRICS_SECRET_BYTES = Array.from({ length: 32 }, (_, i) => i + 1)
const BIOMETRICS_SALT = '0x1111111111111111111111111111111111111111111111111111111111111111'
const BIOMETRICS_IV = '0x22222222222222222222222222222222'
// Dummy stored credential — only needs to exist (non-null) and be hex-parseable; the real values
// are irrelevant because the spec stubs navigator.credentials.get entirely.
const BIOMETRICS_WEBAUTHN_CREDENTIAL = {
  version: 1 as const,
  credentialId: '0x33333333333333333333333333333333',
  salt: '0x44444444444444444444444444444444'
}

// Run from the e2e-playwright-tests directory (paths are resolved relative to cwd).
const readPasswordSecret = () => {
  const fixturePath = path.resolve(process.cwd(), 'fixtures/keystoreMigration.ts')
  const txt = fs.readFileSync(fixturePath, 'utf8')
  const lines = txt.split('\n')
  const idx = lines.findIndex((l) => l.trim().startsWith('keystoreSecrets:'))
  if (idx === -1) throw new Error('Could not find keystoreSecrets in keystoreMigration.ts')
  // The value is the single-quoted JS string literal on the following line, ending in `',`.
  const raw = lines[idx + 1].trim().replace(/^'/, '').replace(/',$/, '')
  const secrets = JSON.parse(raw)
  const password = secrets.find((s: any) => s.id === 'password')
  if (!password) throw new Error('No password secret found in fixture')
  return { secrets, password }
}

// Reverses #unlockWithSecretOld to recover the 32-byte main key (key||iv) the password wraps.
const recoverMainKey = (password: any, keystorePass: string) => {
  // ethers scryptSync returns a 0x-hex string — convert to bytes before slicing.
  const key = getBytes(
    scryptSync(
      getBytesForSecret(keystorePass),
      getBytes(password.scryptParams.salt),
      SCRYPT_PARAMS.N,
      SCRYPT_PARAMS.r,
      SCRYPT_PARAMS.p,
      SCRYPT_PARAMS.dkLen
    )
  )
  const derivedKey = key.slice(0, 16)
  const macPrefix = key.slice(16, 32)
  const ciphertext = getBytes(password.aesEncrypted.ciphertext)

  const mac = keccak256(concat([macPrefix, ciphertext]))
  if (mac !== password.aesEncrypted.mac) {
    throw new Error(
      'MAC mismatch — KEYSTORE_PASS does not match the committed password secret. ' +
        'Use the same value the fixture was encrypted with.'
    )
  }

  const counter = new aes.Counter(getBytes(password.aesEncrypted.iv) as any)
  const aesCtr = new aes.ModeOfOperation.ctr(derivedKey, counter)
  // 32 bytes = mainKey.key(16) || mainKey.iv(16)
  return aesCtr.decrypt(ciphertext)
}

// Builds the legacy AES-CTR `biometrics` secret entry wrapping the same main key.
const buildBiometricsSecretEntry = (mainKeyConcat: Uint8Array) => {
  const biometricsSecretHex = hexlify(new Uint8Array(BIOMETRICS_SECRET_BYTES))
  const key = getBytes(
    scryptSync(
      getBytesForSecret(biometricsSecretHex),
      getBytes(BIOMETRICS_SALT),
      SCRYPT_PARAMS.N,
      SCRYPT_PARAMS.r,
      SCRYPT_PARAMS.p,
      SCRYPT_PARAMS.dkLen
    )
  )
  const derivedKey = key.slice(0, 16)
  const macPrefix = key.slice(16, 32)
  const counter = new aes.Counter(getBytes(BIOMETRICS_IV) as any)
  const aesCtr = new aes.ModeOfOperation.ctr(derivedKey, counter)
  const ciphertext = aesCtr.encrypt(mainKeyConcat)
  const mac = keccak256(concat([macPrefix, ciphertext]))

  return {
    entry: {
      id: 'biometrics',
      scryptParams: { ...SCRYPT_PARAMS, salt: BIOMETRICS_SALT },
      aesEncrypted: {
        ciphertext: hexlify(ciphertext),
        iv: BIOMETRICS_IV,
        mac,
        cipherType: CIPHER_OLD
      }
    },
    biometricsSecretHex
  }
}

const main = () => {
  dotenv.config({ path: path.resolve(process.cwd(), '../.env') })
  const keystorePass = process.env.KEYSTORE_PASS
  if (!keystorePass) throw new Error('KEYSTORE_PASS not set (check repo-root .env)')

  const { secrets, password } = readPasswordSecret()
  const mainKeyConcat = recoverMainKey(password, keystorePass)
  const { entry, biometricsSecretHex } = buildBiometricsSecretEntry(mainKeyConcat)

  const withBiometrics = JSON.stringify([...secrets, entry])

  /* eslint-disable no-console */
  console.log('Biometrics secret entry generated successfully. Output (add to STORAGE):')
  console.log(`Secrets: '${withBiometrics}'`)
  console.log('\n// ---- paste into keystoreMigration.ts ----\n')
  console.log(`export const BIOMETRICS_SECRET_HEX = '${biometricsSecretHex}'`)
  console.log(`export const BIOMETRICS_SECRET_BYTES = ${JSON.stringify(BIOMETRICS_SECRET_BYTES)}`)
  console.log(
    `export const BIOMETRICS_WEBAUTHN_CREDENTIAL = ${JSON.stringify(
      BIOMETRICS_WEBAUTHN_CREDENTIAL
    )}`
  )
  console.log('\n// ---- end ----\n')
  /* eslint-enable no-console */
}

main()
