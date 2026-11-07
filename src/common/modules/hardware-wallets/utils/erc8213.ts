import {
  concat,
  getBytes,
  hashMessage,
  isBytesLike,
  isHexString,
  keccak256,
  toBeHex,
  zeroPadValue
} from 'ethers'

/**
 * The digest names ERC-8213 standardizes, so the labels match what other
 * wallets and hardware wallets that follow it show
 * https://eips.ethereum.org/EIPS/eip-8213
 */
export const ERC_8213_LABELS = {
  calldataDigest: 'Calldata Digest',
  eip712Digest: 'EIP-712 Digest',
  erc191Digest: 'ERC-191 Digest'
} as const

/**
 * ERC-8213 Calldata Digest: keccak256 of the calldata length as a 32-byte
 * big-endian uint256, followed by the calldata. It leaves out the chain and
 * every other transaction field, so the same call has the same digest on any
 * chain. Returns null for empty or malformed calldata, as ERC-8213 shows the
 * digest only for non-empty calldata.
 */
export const getCalldataDigest = (calldata: unknown): string | null => {
  if (!isBytesLike(calldata)) return null

  const calldataBytes = getBytes(calldata)
  if (!calldataBytes.length) return null

  return keccak256(concat([zeroPadValue(toBeHex(calldataBytes.length), 32), calldataBytes]))
}

/**
 * ERC-8213 EIP-712 Digest: keccak256(0x1901 ‖ Domain hash ‖ Message hash),
 * the hash that is signed for typed data. Returns null when either hash is missing.
 */
export const getEip712Digest = (domainHash: unknown, messageHash: unknown): string | null => {
  if (!isHexString(domainHash, 32) || !isHexString(messageHash, 32)) return null

  return keccak256(concat(['0x1901', domainHash, messageHash]))
}

/**
 * ERC-8213 ERC-191 Digest of a personal_sign message (version 0x45):
 * keccak256("\x19Ethereum Signed Message:\n" ‖ byte length ‖ message).
 * A hex message is hashed as the bytes it encodes, as that's what the device
 * signs, and any other text as its UTF-8 bytes.
 */
export const getErc191Digest = (message: unknown): string | null => {
  if (isBytesLike(message)) return hashMessage(getBytes(message))
  if (typeof message === 'string') return hashMessage(message)

  return null
}
