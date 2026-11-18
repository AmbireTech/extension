import { getEIP712Hash } from '@ambire-common/libs/signMessage/signMessage'
import { TypedMessageUserRequest } from '@ambire-common/interfaces/userRequest'

import NfcHardwareSigner from './NfcHardwareSigner'

type TypedData = TypedMessageUserRequest['meta']['params']

const PERMIT2 = '0x000000000022d473030f116ddee9f6b43ac78ba3'
const ATTACKER = '0x6666666666666666666666666666666666666666'
const VICTIM_TOKEN = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
const DRAIN_AMOUNT = '500000000000'
const DEADLINE = '9999999999'
const SHARED_NONCE = '12345'
const WITNESS_NONCE = '67890'
const TOKEN_ID = '1'

const domain = { name: 'Permit2', chainId: 1, verifyingContract: PERMIT2 }

const sharedTypes = {
  EIP712Domain: [
    { name: 'name', type: 'string' },
    { name: 'chainId', type: 'uint256' },
    { name: 'verifyingContract', type: 'address' }
  ],
  TokenPermissions: [
    { name: 'token', type: 'address' },
    { name: 'amount', type: 'uint256' }
  ],
  Permit: [
    { name: 'spender', type: 'address' },
    { name: 'tokenId', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' }
  ],
  // The REAL Permit2 canonical type. Must be named exactly this for a signature over it
  // to be valid/usable on the real Permit2 contract.
  PermitWitnessTransferFrom: [
    { name: 'permitted', type: 'TokenPermissions' },
    { name: 'spender', type: 'address' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
    { name: 'witness', type: 'Permit' }
  ]
}

// Declares `primaryType: 'Permit'` - a small, single-recipient permission - while
// `Permit` is nested as the witness field of `PermitWitnessTransferFrom`, which nothing
// else references. `message` carries both the fields a `Permit` signer would expect
// (spender/tokenId/nonce/deadline) and the fields only the real root reads
// (permitted/witness), so the two hashing strategies diverge on exactly which struct
// gets hashed.
const mixedTypedData: TypedData = {
  types: sharedTypes,
  domain,
  primaryType: 'Permit',
  message: {
    spender: ATTACKER,
    tokenId: TOKEN_ID,
    nonce: SHARED_NONCE,
    deadline: DEADLINE,
    permitted: { token: VICTIM_TOKEN, amount: DRAIN_AMOUNT },
    witness: { spender: ATTACKER, tokenId: TOKEN_ID, nonce: WITNESS_NONCE, deadline: DEADLINE }
  }
} as unknown as TypedData

// The same root struct, declared honestly as its own primaryType. If the signer hashes
// correctly, this must equal the hash of `mixedTypedData`'s declared `Permit` struct - not
// this one.
const honestDrainTypedData: TypedData = {
  types: sharedTypes,
  domain,
  primaryType: 'PermitWitnessTransferFrom',
  message: {
    permitted: { token: VICTIM_TOKEN, amount: DRAIN_AMOUNT },
    spender: ATTACKER,
    nonce: SHARED_NONCE,
    deadline: DEADLINE,
    witness: { spender: ATTACKER, tokenId: TOKEN_ID, nonce: WITNESS_NONCE, deadline: DEADLINE }
  }
} as unknown as TypedData

describe('NfcHardwareSigner.getTypedDataHash', () => {
  it('hashes the declared primaryType, matching getEIP712Hash (what every other signer uses)', () => {
    const honestlyDeclaredTypedData: TypedData = {
      types: {
        EIP712Domain: sharedTypes.EIP712Domain,
        Permit: sharedTypes.Permit
      },
      domain,
      primaryType: 'Permit',
      message: { spender: ATTACKER, tokenId: TOKEN_ID, nonce: SHARED_NONCE, deadline: DEADLINE }
    } as unknown as TypedData

    expect(NfcHardwareSigner.getTypedDataHash(honestlyDeclaredTypedData)).toBe(
      getEIP712Hash(honestlyDeclaredTypedData)
    )
  })

  // Regression test: the card must sign a hash of the declared `primaryType` ('Permit'),
  // the same struct the request was validated and displayed as. It must NOT sign the hash
  // of `PermitWitnessTransferFrom` just because that happens to be the one type in `types`
  // that nothing else references.
  it('signs the struct declared as primaryType, not an ethers-inferred root type', () => {
    const hash = NfcHardwareSigner.getTypedDataHash(mixedTypedData)

    expect(hash).toBe(getEIP712Hash(mixedTypedData))
    expect(hash).not.toBe(getEIP712Hash(honestDrainTypedData))
  })
})
