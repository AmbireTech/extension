import { getBytes, hexlify } from 'ethers'

import { storage } from '@common/services/storage'

const WEBAUTHN_BIOMETRICS_STORAGE_KEY = 'biometricsWebAuthnCredential'
const WEBAUTHN_TIMEOUT_MS = 60_000

type StoredBiometricsCredential = {
  version: 1
  credentialId: string
  salt: string
}

const toUint8Array = (value: ArrayBuffer | Uint8Array) =>
  value instanceof Uint8Array ? value : new Uint8Array(value)

const decodeStoredBytes = (value: string) => getBytes(value)

const getRandomBytes = (length: number) => {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)

  return bytes
}

const getStoredCredential = () =>
  storage.get(WEBAUTHN_BIOMETRICS_STORAGE_KEY, null) as Promise<StoredBiometricsCredential | null>

let cachedStoredCredential: StoredBiometricsCredential | null | undefined

const warmStoredCredentialCache = async () => {
  cachedStoredCredential = await getStoredCredential()
}

const getCachedStoredCredential = async () => {
  if (cachedStoredCredential !== undefined) return cachedStoredCredential

  await warmStoredCredentialCache()

  return cachedStoredCredential ?? null
}

const getHmacSecretOutput = (results: any) => {
  // prioritize, because that’s the modern WebAuthn approach
  const prfResult = results?.prf?.results?.first
  if (prfResult) return toUint8Array(prfResult)

  const hmacSecretResult = results?.hmacGetSecret?.output1
  if (hmacSecretResult) return toUint8Array(hmacSecretResult)

  return null
}

const getAssertionForCredential = async (storedCredential: StoredBiometricsCredential) => {
  const abortController = new AbortController()
  const timeoutId = setTimeout(() => abortController.abort(), WEBAUTHN_TIMEOUT_MS)

  try {
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
      },
      signal: abortController.signal
    } as CredentialRequestOptions)) as PublicKeyCredential | null

    if (!credential) return null

    const extensionResults =
      typeof (credential as any).getClientExtensionResults === 'function'
        ? (credential as any).getClientExtensionResults()
        : {}

    return getHmacSecretOutput(extensionResults)
  } catch (error) {
    if (abortController.signal.aborted) return null

    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

const getCredentialExtensionResults = (credential: PublicKeyCredential | null) =>
  credential && typeof (credential as any).getClientExtensionResults === 'function'
    ? (credential as any).getClientExtensionResults()
    : {}

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
    return !!(await getCachedStoredCredential())
  },

  async warmCredentialCache() {
    await warmStoredCredentialCache()
  },

  async createSecret(userId: Buffer) {
    const isSupported = await this.isSupported()
    if (!isSupported) return null

    const salt = getRandomBytes(32)
    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge: getRandomBytes(32),
        rp: {
          name: 'ambire.com'
        },
        user: {
          id: userId,
          name: 'Ambire Web3 Wallet',
          displayName: 'Ambire Web3 Wallet'
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 }
        ],
        authenticatorSelection: {
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

    const storedCredential: StoredBiometricsCredential = {
      version: 1,
      credentialId: hexlify(toUint8Array((credential as any).rawId)),
      salt: hexlify(salt)
    }

    let secretBytes = getHmacSecretOutput(getCredentialExtensionResults(credential))
    if (!secretBytes) {
      secretBytes = await getAssertionForCredential(storedCredential)
    }

    if (!secretBytes) return null

    await storage.set(WEBAUTHN_BIOMETRICS_STORAGE_KEY, storedCredential)
    cachedStoredCredential = storedCredential

    return hexlify(secretBytes)
  },

  async getSecret() {
    if (cachedStoredCredential !== undefined) {
      if (!cachedStoredCredential) return null

      const secretBytes = await getAssertionForCredential(cachedStoredCredential)
      if (!secretBytes) return null

      return hexlify(secretBytes)
    }

    const storedCredential = await getCachedStoredCredential()
    if (!storedCredential) return null

    const secretBytes = await getAssertionForCredential(storedCredential)
    if (!secretBytes) return null

    return hexlify(secretBytes)
  },

  async authenticate() {
    return !!(await this.getSecret())
  },

  async removeCredential() {
    await storage.remove(WEBAUTHN_BIOMETRICS_STORAGE_KEY)
    cachedStoredCredential = null
  }
}
