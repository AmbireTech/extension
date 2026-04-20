import { hexlify } from 'ethers'

import { storage } from '@common/services/storage'
import { getExtensionInstanceId } from '@web/utils/analytics'

const WEBAUTHN_BIOMETRICS_STORAGE_KEY = 'biometricsWebAuthnCredential_v1'
const WEBAUTHN_TIMEOUT_MS = 60_000

type StoredBiometricsCredential = {
  version: 1
  credentialId: string
  salt: string
}

const toUint8Array = (value: ArrayBuffer | Uint8Array) =>
  value instanceof Uint8Array ? value : new Uint8Array(value)

const toBase64Url = (value: ArrayBuffer | Uint8Array) => {
  const base64 = btoa(String.fromCharCode(...toUint8Array(value)))

  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

const fromBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  const decoded = atob(padded)

  return Uint8Array.from(decoded, (char) => char.charCodeAt(0))
}

const getRandomBytes = (length: number) => {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)

  return bytes
}

const getStoredCredential = () =>
  storage.get(WEBAUTHN_BIOMETRICS_STORAGE_KEY, null) as Promise<StoredBiometricsCredential | null>

const getHmacSecretOutput = (results: any) => {
  const prfResult = results?.prf?.results?.first
  if (prfResult) return toUint8Array(prfResult)

  const hmacSecretResult = results?.hmacGetSecret?.output1
  if (hmacSecretResult) return toUint8Array(hmacSecretResult)

  return null
}

const getAssertionForCredential = async (storedCredential: StoredBiometricsCredential) => {
  const credential = (await navigator.credentials.get({
    publicKey: {
      challenge: getRandomBytes(32),
      timeout: WEBAUTHN_TIMEOUT_MS,
      userVerification: 'required',
      allowCredentials: [
        {
          id: fromBase64Url(storedCredential.credentialId),
          type: 'public-key'
        }
      ],
      extensions: {
        prf: {
          eval: {
            first: fromBase64Url(storedCredential.salt)
          }
        },
        hmacGetSecret: {
          salt1: fromBase64Url(storedCredential.salt)
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
    return !!(await getStoredCredential())
  },

  async createSecret(keyStoreUid: string | null, verifiedCode: string | null) {
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
          id: Buffer.from(getExtensionInstanceId(keyStoreUid, verifiedCode)),
          name: 'Ambire Web3 Wallet',
          displayName: 'Ambire Web3 Wallet'
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 }
        ],
        authenticatorSelection: {
          residentKey: 'required',
          userVerification: 'required'
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
      credentialId: toBase64Url((credential as any).rawId),
      salt: toBase64Url(salt)
    }

    let secretBytes = getHmacSecretOutput(getCredentialExtensionResults(credential))
    if (!secretBytes) {
      secretBytes = await getAssertionForCredential(storedCredential)
    }

    if (!secretBytes) return null

    await storage.set(WEBAUTHN_BIOMETRICS_STORAGE_KEY, storedCredential)

    return hexlify(secretBytes)
  },

  async getSecret() {
    const storedCredential = await getStoredCredential()
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
  }
}
