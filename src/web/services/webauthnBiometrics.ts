import { getBytes, hexlify } from 'ethers'

import { storage } from '@common/services/storage'

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
  encryptedSecret: string
  iv: string
}

type StoredCredential = StoredPrfBiometricsCredential | StoredEncryptedBiometricsCredential

const encoder = new TextEncoder()
const decoder = new TextDecoder()

const toUint8Array = (value: ArrayBuffer | Uint8Array) =>
  value instanceof Uint8Array ? value : new Uint8Array(value)

const toArrayBuffer = (value: Uint8Array) =>
  value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength) as ArrayBuffer

const decodeStoredBytes = (value: string) => getBytes(value)

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

const deriveAesKey = async (secret: Uint8Array) => {
  if ([16, 24, 32].includes(secret.byteLength)) {
    return crypto.subtle.importKey('raw', toArrayBuffer(secret), { name: 'AES-GCM' }, false, [
      'encrypt',
      'decrypt'
    ])
  }

  const hkdfKey = await crypto.subtle.importKey('raw', toArrayBuffer(secret), 'HKDF', false, [
    'deriveKey'
  ])

  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(0),
      info: encoder.encode('ambire-biometric-unlock')
    },
    hkdfKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

const encryptSecret = async (secret: string, userHandle: Uint8Array) => {
  const key = await deriveAesKey(userHandle)
  const iv = getRandomBytes(12)
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(secret)
  )

  return {
    encryptedSecret: hexlify(toUint8Array(encrypted)),
    iv: hexlify(iv)
  }
}

const decryptSecret = async (
  storedCredential: StoredEncryptedBiometricsCredential,
  userHandle: Uint8Array
) => {
  const key = await deriveAesKey(userHandle)
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(decodeStoredBytes(storedCredential.iv)) },
    key,
    toArrayBuffer(decodeStoredBytes(storedCredential.encryptedSecret))
  )

  return decoder.decode(decrypted)
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
      userVerification: 'preferred',
      allowCredentials: [
        {
          id: decodeStoredBytes(storedCredential.credentialId),
          type: 'public-key'
        }
      ]
    }
  } as CredentialRequestOptions)) as PublicKeyCredential | null

  if (!credential) return null

  const expectedCredentialId = decodeStoredBytes(storedCredential.credentialId)
  const credentialId = toUint8Array((credential as any).rawId)
  if (!equalBytes(credentialId, expectedCredentialId)) return null

  if (
    typeof AuthenticatorAssertionResponse === 'undefined' ||
    !(credential.response instanceof AuthenticatorAssertionResponse) ||
    !credential.response.userHandle
  ) {
    return null
  }

  return toUint8Array(credential.response.userHandle)
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

  async createSecret() {
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
          credProps: true,
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
    // only if it's not possible, continue with version
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
    const secret = hexlify(getRandomBytes(32))
    const encrypted = await encryptSecret(secret, userHandle)
    const storedCredential: StoredEncryptedBiometricsCredential = {
      version: 2,
      credentialId: hexlify(toUint8Array((credential as any).rawId)),
      encryptedSecret: encrypted.encryptedSecret,
      iv: encrypted.iv
    }

    await storage.set(WEBAUTHN_BIOMETRICS_STORAGE_KEY, storedCredential)

    return secret
  },

  async getSecret() {
    const storedCredential = await getStoredCredential()
    if (!storedCredential) return null

    // non prf/hmca handler
    if (storedCredential.version === 2) {
      const userHandle = await getAssertionUserHandle(storedCredential)
      if (!userHandle) return null

      return decryptSecret(storedCredential, userHandle)
    }

    const secretBytes = await getAssertionForPrfCredential(storedCredential)
    if (!secretBytes) return null

    return hexlify(secretBytes)
  },

  async authenticate() {
    return !!(await this.getSecret())
  },

  async removeCredential() {
    await storage.remove(WEBAUTHN_BIOMETRICS_STORAGE_KEY)
  }
}
