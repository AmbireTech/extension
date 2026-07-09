import { getBytes, hexlify } from 'ethers'

import { EntropyGenerator } from '@ambire-common/libs/entropyGenerator/entropyGenerator'
import { CIPHER, decryptWithKey, encryptWithKey } from '@ambire-common/libs/keystore/keystore'
import { storage } from '@common/services/storage'
import { captureException } from '@sentry/browser'

import type { AESGCMEncrypted } from '@ambire-common/interfaces/keystore'
const WEBAUTHN_BIOMETRICS_STORAGE_KEY = 'biometricsWebAuthnCredential'
const WEBAUTHN_TIMEOUT_MS = 60_000

type StoredPrfBiometricsCredential = {
  version: 1
  credentialId: string
  salt: string
}

type StoredEncryptedBiometricsCredential = {
  version: 2
  credentialId: string
} & AESGCMEncrypted

type StoredCredential = StoredPrfBiometricsCredential | StoredEncryptedBiometricsCredential

const encoder = new TextEncoder()
const decoder = new TextDecoder()

const toUint8Array = (value: ArrayBuffer | Uint8Array) =>
  value instanceof Uint8Array ? value : new Uint8Array(value)

const toArrayBuffer = (value: Uint8Array) =>
  value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength) as ArrayBuffer

const decodeStoredBytes = (value: string) => getBytes(value)

const toBase64Url = (value: Uint8Array) => {
  let binary = ''
  value.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

const getBiometricRpId = () => window.location.hostname

const getRandomBytes = (length: number) => {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)

  return bytes
}

const getStoredCredential = () =>
  storage.get(WEBAUTHN_BIOMETRICS_STORAGE_KEY, null) as Promise<StoredCredential | null>

const equalBytes = (left: Uint8Array, right: Uint8Array) => {
  if (left.byteLength !== right.byteLength) return false

  for (let i = 0; i < left.byteLength; i++) {
    if (left[i] !== right[i]) return false
  }

  return true
}

const getBiometricsSecretKey = async (userHandle: Uint8Array) => {
  const hkdfKey = await crypto.subtle.importKey('raw', toArrayBuffer(userHandle), 'HKDF', false, [
    'deriveKey'
  ])

  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(0),
      info: encoder.encode('ambire-biometrics-unlock')
    },
    hkdfKey,
    { name: CIPHER, length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

const getHmacSecretOutput = (results: any) => {
  // prioritize, because that's the modern WebAuthn approach
  const prfResult = results?.prf?.results?.first
  if (prfResult) return toUint8Array(prfResult)

  const hmacSecretResult = results?.hmacGetSecret?.output1
  if (hmacSecretResult) return toUint8Array(hmacSecretResult)

  return null
}

const getCredentialExtensionResults = (credential: PublicKeyCredential | null) =>
  credential && typeof (credential as any).getClientExtensionResults === 'function'
    ? (credential as any).getClientExtensionResults()
    : {}

const shouldTryPrfAssertion = (results: any) =>
  results?.prf?.enabled !== false || results?.hmacCreateSecret === true

const getAssertionForPrfCredential = async (storedCredential: StoredPrfBiometricsCredential) => {
  const credential = (await navigator.credentials.get({
    publicKey: {
      challenge: getRandomBytes(32),
      timeout: WEBAUTHN_TIMEOUT_MS,
      userVerification: 'preferred',
      allowCredentials: [
        {
          id: decodeStoredBytes(storedCredential.credentialId),
          type: 'public-key'
        }
      ],
      // prf.results.first is the new WebAuthn PRF extension result
      // hmacGetSecret.output1 is legacy/fallback result from CTAP hmac-secret
      extensions: {
        prf: {
          eval: {
            first: decodeStoredBytes(storedCredential.salt)
          }
        },
        hmacGetSecret: {
          salt1: decodeStoredBytes(storedCredential.salt)
        }
      }
    }
  } as CredentialRequestOptions)) as PublicKeyCredential | null

  if (!credential) return null

  const extensionResults =
    typeof (credential as any).getClientExtensionResults === 'function'
      ? (credential as any).getClientExtensionResults()
      : {}

  return getHmacSecretOutput(extensionResults)
}

// This is only used by the Brave-compatible fallback credential format (version 2).
// Some passkey providers, such as Brave profile passkeys, can create and verify
// WebAuthn credentials but do not return PRF/hmac-secret output. For those, we
// use the passkey authentication as the gate and derive the local AES decrypt key
// from the credential's userHandle, which WebAuthn returns after successful user
// verification for the resident credential we created.
const getAssertionUserHandle = async (storedCredential: StoredEncryptedBiometricsCredential) => {
  const credential = (await navigator.credentials.get({
    publicKey: {
      challenge: getRandomBytes(32),
      timeout: WEBAUTHN_TIMEOUT_MS,
      userVerification: 'required',
      allowCredentials: [
        {
          id: decodeStoredBytes(storedCredential.credentialId),
          type: 'public-key'
        }
      ]
    }
  } as CredentialRequestOptions)) as PublicKeyCredential | null

  // the user cancelled the req
  if (!credential) return null

  if (!(credential instanceof PublicKeyCredential)) {
    captureException(
      new Error('Biometric unlock not supported: credential not instanceof PublicKeyCredential')
    )
    return null
  }

  if (!(credential.response instanceof AuthenticatorAssertionResponse)) {
    captureException(
      new Error(
        'Biometric unlock not supported: credential.response not instanceof AuthenticatorAssertionResponse'
      )
    )
    return null
  }

  const { userHandle } = credential.response
  if (!userHandle) {
    captureException(new Error('Biometric unlock not supported: userHandle not in response'))
    return null
  }

  // credentials mismatch
  const expectedCredentialId = decodeStoredBytes(storedCredential.credentialId)
  const credentialId = toUint8Array((credential as any).rawId)
  if (!equalBytes(credentialId, expectedCredentialId)) return null

  return toUint8Array(userHandle)
}

export const webauthnBiometrics = {
  async isSupported() {
    if (
      typeof window === 'undefined' ||
      !window.isSecureContext ||
      typeof PublicKeyCredential === 'undefined' ||
      !navigator.credentials
    ) {
      return false
    }

    if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== 'function') {
      return true
    }

    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    } catch (e) {
      console.log(
        'Function PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable throwed',
        e
      )
      return false
    }
  },

  async hasStoredCredential() {
    return !!(await getStoredCredential())
  },

  /**
   * Note: the extra entropy is used for v2 biometrics only as v1 is derived
   * hmac/prf - they don't need it
   */
  async createSecret(extraEntropy: string) {
    const isSupported = await this.isSupported()
    if (!isSupported) return null

    const salt = getRandomBytes(32)
    // we need a fresh random secret material for the user id
    // so using the old userId is no longer possible
    const userHandle = getRandomBytes(64)
    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge: getRandomBytes(32),
        rp: {
          name: 'ambire.com'
        },
        user: {
          id: userHandle,
          name: 'Ambire Web3 Wallet',
          displayName: 'Ambire Web3 Wallet'
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 }
        ],
        authenticatorSelection: {
          // requireResidentKey tells WebAuthn: create a discoverable/passkey-style
          // credential that the authenticator can find later;
          // The fallback mechanism needs response.userHandle during unlock so
          // we should keep this to true
          requireResidentKey: true,
          residentKey: 'required',
          userVerification: 'preferred'
        },
        timeout: WEBAUTHN_TIMEOUT_MS,
        attestation: 'none',
        extensions: {
          prf: {
            eval: {
              first: salt
            }
          },
          hmacCreateSecret: true
        }
      }
    } as CredentialCreationOptions)) as PublicKeyCredential | null

    if (!credential) return null

    // try to store the secret in the latest recomended biometrics
    // way by extracting prf or hmac result
    //
    // only if it's not possible, continue with version 2
    const storedPrfCredential: StoredPrfBiometricsCredential = {
      version: 1,
      credentialId: hexlify(toUint8Array((credential as any).rawId)),
      salt: hexlify(salt)
    }
    const extensionResults = getCredentialExtensionResults(credential)
    let secretBytes = getHmacSecretOutput(extensionResults)

    if (!secretBytes && shouldTryPrfAssertion(extensionResults)) {
      secretBytes = await getAssertionForPrfCredential(storedPrfCredential)
    }
    if (secretBytes) {
      await storage.set(WEBAUTHN_BIOMETRICS_STORAGE_KEY, storedPrfCredential)
      return hexlify(secretBytes)
    }

    // coming here means prf/hmac are not supported for the chosen
    // passkey generation and we must use a different method
    const secret = hexlify(new EntropyGenerator().generateRandomBytes(32, extraEntropy))
    const key = await getBiometricsSecretKey(userHandle)
    const encrypted = await encryptWithKey(key, encoder.encode(secret))
    const storedCredential: StoredEncryptedBiometricsCredential = {
      version: 2,
      credentialId: hexlify(toUint8Array((credential as any).rawId)),
      ...encrypted
    }

    await storage.set(WEBAUTHN_BIOMETRICS_STORAGE_KEY, storedCredential)

    return secret
  },

  async getSecret() {
    const storedCredential = await getStoredCredential()
    if (!storedCredential) return null

    // non prf/hmac handler
    if (storedCredential.version === 2) {
      const userHandle = await getAssertionUserHandle(storedCredential)
      if (!userHandle) return null

      const key = await getBiometricsSecretKey(userHandle)
      const secret = await decryptWithKey(key, storedCredential)

      return decoder.decode(secret)
    }

    const secretBytes = await getAssertionForPrfCredential(storedCredential)
    if (!secretBytes) return null

    return hexlify(secretBytes)
  },

  async authenticate() {
    return !!(await this.getSecret())
  },

  async removeCredential() {
    const storedCredential = await getStoredCredential()
    await storage.remove(WEBAUTHN_BIOMETRICS_STORAGE_KEY)
    if (!storedCredential || typeof PublicKeyCredential === 'undefined') return

    // not every browser supports this
    const publicKeyCredentialCtor = PublicKeyCredential as typeof PublicKeyCredential & {
      signalUnknownCredential?: (options: { rpId: string; credentialId: string }) => Promise<void>
    }
    try {
      if (publicKeyCredentialCtor.signalUnknownCredential) {
        await publicKeyCredentialCtor.signalUnknownCredential({
          rpId: getBiometricRpId(),
          credentialId: toBase64Url(decodeStoredBytes(storedCredential.credentialId))
        })
      }
    } catch (e) {
      console.error(e)
    }
  }
}
