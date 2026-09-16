import aes from 'aes-js'
import { getBytes, randomBytes, SigningKey } from 'ethers'

import { sha256 } from '@noble/hashes/sha256'

/**
 * Ledger Secure Channel Protocol (SCP v2) crypto, ported from ledgerctl
 * (LedgerHQ/ledgerctl `ledgerwallet/crypto/scp.py` and `ecc.py`). Used to
 * sideload a custom app: the load commands must be wrapped in this channel,
 * they cannot be replayed in the clear.
 *
 * All primitives were validated byte-for-byte against ledgerctl reference
 * vectors. Uses only existing deps: ethers (secp256k1), @noble/hashes (SHA256),
 * aes-js (AES-128-CBC).
 */

// secp256k1 curve order
const SECP256K1_ORDER = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141')
const BLOCK_SIZE = 16
const SCP_MAC_LENGTH = 14

const concatBytes = (...arrays: Uint8Array[]) => {
  const out = new Uint8Array(arrays.reduce((n, a) => n + a.length, 0))
  let offset = 0
  for (const a of arrays) {
    out.set(a, offset)
    offset += a.length
  }
  return out
}

const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

const withHexPrefix = (hex: string): string => (hex.startsWith('0x') ? hex : `0x${hex}`)

// ISO 9797-1 padding method 2: append 0x80, then 0x00 up to the block boundary.
const iso9797Pad = (data: Uint8Array): Uint8Array => {
  const paddingLen = BLOCK_SIZE - (data.length % BLOCK_SIZE)
  return concatBytes(data, Uint8Array.of(0x80), new Uint8Array(paddingLen - 1))
}

const iso9797Unpad = (data: Uint8Array): Uint8Array => {
  for (let i = data.length - 1; i >= 0; i -= 1) {
    if (data[i] === 0x80) return data.slice(0, i)
    if (data[i] !== 0) throw new Error('Invalid SCP padding')
  }
  throw new Error('Invalid SCP padding')
}

// Derives a 16-byte session key from the ECDH shared secret, mirroring
// ledgerctl's SCP._derive_key: hash (index || retry || secret) into a valid
// secp256k1 scalar, then hash that scalar's uncompressed public point.
const deriveSessionKey = (secret: Uint8Array, index: number): Uint8Array => {
  let retry = 0
  for (;;) {
    const prefix = new Uint8Array(5)
    new DataView(prefix.buffer).setUint32(0, index, false)
    prefix[4] = retry
    const scalar = BigInt(`0x${toHex(sha256(concatBytes(prefix, secret)))}`)
    if (scalar > 0n && scalar < SECP256K1_ORDER) {
      const publicPoint = getBytes(
        SigningKey.computePublicKey(`0x${scalar.toString(16).padStart(64, '0')}`, false)
      )
      return sha256(publicPoint).slice(0, BLOCK_SIZE)
    }
    retry += 1
  }
}

const aesCbc = (key: Uint8Array, iv: Uint8Array) => new aes.ModeOfOperation.cbc(key, iv)

export class LedgerScp {
  #encKey: Uint8Array

  #macKey: Uint8Array

  #encIv: Uint8Array = new Uint8Array(BLOCK_SIZE)

  #macIv: Uint8Array = new Uint8Array(BLOCK_SIZE)

  constructor(sharedSecret: Uint8Array) {
    this.#encKey = deriveSessionKey(sharedSecret, 0)
    this.#macKey = deriveSessionKey(sharedSecret, 1)
  }

  // AES-128-CBC with a rolling IV (previous ciphertext's last block), kept in
  // lockstep with the device across every wrap and unwrap.
  #encrypt(data: Uint8Array): Uint8Array {
    const encrypted = aesCbc(this.#encKey, this.#encIv).encrypt(data)
    this.#encIv = encrypted.slice(-BLOCK_SIZE)
    return encrypted
  }

  #decrypt(data: Uint8Array): Uint8Array {
    const decrypted = aesCbc(this.#encKey, this.#encIv).decrypt(data)
    this.#encIv = data.slice(-BLOCK_SIZE)
    return decrypted
  }

  #computeMac(data: Uint8Array): Uint8Array {
    const macBlocks = aesCbc(this.#macKey, this.#macIv).encrypt(data)
    this.#macIv = macBlocks.slice(-BLOCK_SIZE)
    return macBlocks.slice(-BLOCK_SIZE)
  }

  wrap(data: Uint8Array): Uint8Array {
    const encrypted = this.#encrypt(iso9797Pad(data))
    const mac = this.#computeMac(encrypted)
    return concatBytes(encrypted, mac.slice(-SCP_MAC_LENGTH))
  }

  unwrap(data: Uint8Array): Uint8Array {
    if (data.length === 0) return new Uint8Array(0)

    const encrypted = data.slice(0, -SCP_MAC_LENGTH)
    const mac = data.slice(-SCP_MAC_LENGTH)
    if (toHex(this.#computeMac(encrypted).slice(-SCP_MAC_LENGTH)) !== toHex(mac))
      throw new Error('Invalid SCP MAC')

    return iso9797Unpad(this.#decrypt(encrypted))
  }
}

// ---- handshake crypto helpers (ledgerctl SimpleServer / ecc.PrivateKey) ----

export const randomScalarHex = (): string => `0x${toHex(randomBytes(32))}`

export const randomNonce = (length: number): Uint8Array => randomBytes(length)

export const publicKeyUncompressed = (privHex: string): Uint8Array =>
  getBytes(SigningKey.computePublicKey(withHexPrefix(privHex), false))

// ECDH as computed by Ledger: SHA256 of the compressed shared point.
export const ecdhSharedSecret = (privHex: string, peerPublicKey: Uint8Array): Uint8Array => {
  const sharedPoint = getBytes(
    new SigningKey(withHexPrefix(privHex)).computeSharedSecret(peerPublicKey)
  )
  const x = sharedPoint.slice(1, 33)
  const y = sharedPoint.slice(33, 65)
  const prefix = (y[y.length - 1]! & 1) === 1 ? 0x03 : 0x02
  return sha256(concatBytes(Uint8Array.of(prefix), x))
}

// Minimal DER encoding of one positive integer (an ECDSA r or s component).
const derEncodeInteger = (value: Uint8Array): Uint8Array => {
  let start = 0
  while (start < value.length - 1 && value[start] === 0) start += 1
  let trimmed = value.slice(start)
  if ((trimmed[0]! & 0x80) !== 0) trimmed = concatBytes(Uint8Array.of(0x00), trimmed)
  return concatBytes(Uint8Array.of(0x02, trimmed.length), trimmed)
}

// Signs SHA256(message) with secp256k1, returning a canonical (low-s) DER signature.
export const signSha256Der = (privHex: string, message: Uint8Array): Uint8Array => {
  const signature = new SigningKey(withHexPrefix(privHex)).sign(sha256(message))
  const body = concatBytes(
    derEncodeInteger(getBytes(signature.r)),
    derEncodeInteger(getBytes(signature.s))
  )
  return concatBytes(Uint8Array.of(0x30, body.length), body)
}
