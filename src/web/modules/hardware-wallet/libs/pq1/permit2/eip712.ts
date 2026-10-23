// The EIP-712 digest of a Uniswap Permit2 permit: what Permit2 passes to the
// wallet's `isValidSignature`. The device recomputes the same digest from
// the canonical permit it shows.

import { keccak256, stringToBytes } from 'viem'

import {
  PERMIT2_VARIANT_BATCH,
  PERMIT2_VARIANT_BATCH_TRANSFER,
  PERMIT2_VARIANT_SINGLE,
  PERMIT2_VARIANT_TRANSFER
} from '../config'
import { addressBytes, concatBytes, u256be } from '../transport/bytes'
import { isAllowancePermit, isBatchVariant, type Permit2, type Permit2Variant } from './canonical'

/** Uniswap's canonical Permit2 deployment, the EIP-712 `verifyingContract`
 *  of every permit (same address on every chain). */
export const PERMIT2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3' as const

const keccak = (bytes: Uint8Array) => keccak256(bytes, 'bytes')
const keccakOfText = (text: string) => keccak(stringToBytes(text))
const addressWord = (address: string) => concatBytes([new Uint8Array(12), addressBytes(address)])

// Permit2's domain has a name but no version.
const DOMAIN_TYPEHASH = keccakOfText(
  'EIP712Domain(string name,uint256 chainId,address verifyingContract)'
)
const DOMAIN_NAME_HASH = keccakOfText('Permit2')

// The type strings of Permit2's `PermitHash` library. A primary type's
// string ends with that of the struct it nests.
const PERMIT_DETAILS_TYPE =
  'PermitDetails(address token,uint160 amount,uint48 expiration,uint48 nonce)'
const TOKEN_PERMISSIONS_TYPE = 'TokenPermissions(address token,uint256 amount)'
const PERMIT_DETAILS_TYPEHASH = keccakOfText(PERMIT_DETAILS_TYPE)
const TOKEN_PERMISSIONS_TYPEHASH = keccakOfText(TOKEN_PERMISSIONS_TYPE)
const PRIMARY_TYPEHASH: Record<Permit2Variant, Uint8Array> = {
  [PERMIT2_VARIANT_SINGLE]: keccakOfText(
    `PermitSingle(PermitDetails details,address spender,uint256 sigDeadline)${PERMIT_DETAILS_TYPE}`
  ),
  [PERMIT2_VARIANT_BATCH]: keccakOfText(
    `PermitBatch(PermitDetails[] details,address spender,uint256 sigDeadline)${PERMIT_DETAILS_TYPE}`
  ),
  [PERMIT2_VARIANT_TRANSFER]: keccakOfText(
    `PermitTransferFrom(TokenPermissions permitted,address spender,uint256 nonce,uint256 deadline)${TOKEN_PERMISSIONS_TYPE}`
  ),
  [PERMIT2_VARIANT_BATCH_TRANSFER]: keccakOfText(
    `PermitBatchTransferFrom(TokenPermissions[] permitted,address spender,uint256 nonce,uint256 deadline)${TOKEN_PERMISSIONS_TYPE}`
  )
}

function domainSeparator(chainId: bigint): Uint8Array {
  return keccak(
    concatBytes([DOMAIN_TYPEHASH, DOMAIN_NAME_HASH, u256be(chainId), addressWord(PERMIT2_ADDRESS)])
  )
}

/** The hash of the permit's nested member: one struct, or for a batch
 *  variant the hash of its structs' hashes (an EIP-712 array). */
function memberHash(p: Permit2): Uint8Array {
  const tokenHashes = isAllowancePermit(p)
    ? p.tokens.map((t) =>
        keccak(
          concatBytes([
            PERMIT_DETAILS_TYPEHASH,
            addressWord(t.token),
            u256be(t.amount),
            u256be(t.expiration),
            u256be(t.nonce)
          ])
        )
      )
    : p.tokens.map((t) =>
        keccak(concatBytes([TOKEN_PERMISSIONS_TYPEHASH, addressWord(t.token), u256be(t.amount)]))
      )
  if (isBatchVariant(p.variant)) return keccak(concatBytes(tokenHashes))
  if (tokenHashes.length !== 1) throw new Error('permit2: a single permit names one token')
  return tokenHashes[0]!
}

function structHash(p: Permit2): Uint8Array {
  const fieldsAfterSpender = isAllowancePermit(p)
    ? [u256be(p.sigDeadline)]
    : [u256be(p.nonce), u256be(p.deadline)]
  return keccak(
    concatBytes([
      PRIMARY_TYPEHASH[p.variant],
      memberHash(p),
      addressWord(p.spender),
      ...fieldsAfterSpender
    ])
  )
}

/** The EIP-712 digest of `p` under the Permit2 domain for `p.chainId`. */
export function computePermit2Digest(p: Permit2): Uint8Array {
  return keccak(
    concatBytes([new Uint8Array([0x19, 0x01]), domainSeparator(p.chainId), structHash(p)])
  )
}
