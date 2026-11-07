import { concat, keccak256, solidityPacked, toUtf8Bytes, TypedDataEncoder } from 'ethers'

import { getCalldataDigest, getEip712Digest, getErc191Digest } from './erc8213'

// The test vectors from ERC-8213
const TRANSFER_CALLDATA =
  '0xa9059cbb0000000000000000000000004675c7e5baafbffbca748158becba61ef3b0a2630000000000000000000000000000000000000000000000000de0b6b3a7640000'
const TRANSFER_CALLDATA_DIGEST =
  '0x812cee5d9cc7461c04bbcd7b70af9c28b243ac5d74d3453b008b93b7dac69985'
const HELLO_DIGEST = '0x50b2c43fd39106bafbba0da34fc430e1f91e3c96ea2acee2bc34119f92b37750'
const HELLO_ACCENTED_DIGEST = '0x42fd95dd8ed22d7d934d6ffff71ed0b730835b0de4bb3532a271568c8760c8d2'

describe('ERC-8213 digests', () => {
  describe('Calldata Digest', () => {
    test('matches the ERC-8213 test vector', () => {
      expect(getCalldataDigest(TRANSFER_CALLDATA)).toBe(TRANSFER_CALLDATA_DIGEST)
    })

    test('matches the Solidity reference: keccak256(abi.encodePacked(uint256(data.length), data))', () => {
      const calldata = '0x1234abcd'

      expect(getCalldataDigest(calldata)).toBe(
        keccak256(solidityPacked(['uint256', 'bytes'], [4n, calldata]))
      )
    })

    test('the length prefix tells apart calldata that only differs in trailing bytes', () => {
      expect(getCalldataDigest('0x1234')).not.toBe(getCalldataDigest('0x123400'))
    })

    test('the hex case does not change the digest, as the bytes are the same', () => {
      expect(getCalldataDigest(TRANSFER_CALLDATA.toUpperCase().replace('0X', '0x'))).toBe(
        TRANSFER_CALLDATA_DIGEST
      )
    })

    test('empty calldata has no digest, as ERC-8213 shows it only for non-empty calldata', () => {
      expect(getCalldataDigest('0x')).toBeNull()
    })

    test('malformed calldata has no digest', () => {
      expect(getCalldataDigest('0x123')).toBeNull()
      expect(getCalldataDigest('1234')).toBeNull()
      expect(getCalldataDigest('0xzz')).toBeNull()
      expect(getCalldataDigest(undefined)).toBeNull()
      expect(getCalldataDigest(1234)).toBeNull()
    })
  })

  describe('ERC-191 Digest', () => {
    test('matches the ERC-8213 test vectors', () => {
      expect(getErc191Digest('hello')).toBe(HELLO_DIGEST)
      // 6 bytes in UTF-8, so the length is 6 and not 5
      expect(getErc191Digest('héllo')).toBe(HELLO_ACCENTED_DIGEST)
    })

    test('a hex message is hashed as the bytes it encodes, not as its text', () => {
      const helloHex = `0x${Buffer.from(toUtf8Bytes('hello')).toString('hex')}`

      expect(getErc191Digest(helloHex)).toBe(HELLO_DIGEST)
    })

    test('a message that is not text has no digest', () => {
      expect(getErc191Digest(undefined)).toBeNull()
      expect(getErc191Digest({ message: 'hello' })).toBeNull()
    })
  })

  describe('EIP-712 Digest', () => {
    test('is the hash signed for the typed data', () => {
      const domain = { name: 'Test', version: '1', chainId: 1 }
      const types = { Mail: [{ name: 'contents', type: 'string' }] }
      const message = { contents: 'hello' }

      expect(
        getEip712Digest(
          TypedDataEncoder.hashDomain(domain),
          TypedDataEncoder.hashStruct('Mail', types, message)
        )
      ).toBe(TypedDataEncoder.hash(domain, types, message))
    })

    test('is keccak256(0x1901 ‖ Domain hash ‖ Message hash)', () => {
      const domainHash = `0x${'1b'.repeat(32)}`
      const messageHash = `0x${'e4'.repeat(32)}`

      expect(getEip712Digest(domainHash, messageHash)).toBe(
        keccak256(concat(['0x1901', domainHash, messageHash]))
      )
    })

    test('a missing or malformed hash gives no digest, as one hash alone is not enough', () => {
      const hash = `0x${'1b'.repeat(32)}`

      expect(getEip712Digest(hash, undefined)).toBeNull()
      expect(getEip712Digest(undefined, hash)).toBeNull()
      expect(getEip712Digest(hash, '0x1234')).toBeNull()
    })
  })
})
