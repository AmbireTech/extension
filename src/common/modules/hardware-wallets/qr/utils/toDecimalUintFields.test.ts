import { TypedDataEncoder, ZeroAddress } from 'ethers'

import { getSafeTypedData } from '@ambire-common/libs/signMessage/signMessage'

import { toDecimalUintFields } from './toDecimalUintFields'

const SAFE_ADDRESS = '0xa60000000000000000000000000000000000ced5'

const getSafeTxTypedData = () =>
  getSafeTypedData(10n, SAFE_ADDRESS, {
    to: '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE',
    value: '0x00',
    data: '0x095ea7b3',
    operation: 1,
    safeTxGas: '0x00',
    baseGas: '0x00',
    gasPrice: '0x00',
    gasToken: ZeroAddress as `0x${string}`,
    refundReceiver: ZeroAddress as `0x${string}`,
    nonce: '0x07'
  })

describe('toDecimalUintFields', () => {
  it('rewrites the hex uint fields of a Safe transaction as decimal strings', () => {
    const typedData = getSafeTxTypedData()

    expect(toDecimalUintFields('SafeTx', typedData.message, typedData.types as any)).toEqual({
      ...typedData.message,
      value: '0',
      safeTxGas: '0',
      baseGas: '0',
      gasPrice: '0',
      nonce: '7'
    })
  })

  it('does not change the hash that gets signed', () => {
    const typedData = getSafeTxTypedData()
    const types = { ...(typedData.types as any) }
    // ethers derives the domain type from the domain itself and rejects it in `types`
    delete types.EIP712Domain
    const normalizedMessage = toDecimalUintFields(
      'SafeTx',
      typedData.message,
      typedData.types as any
    )

    expect(TypedDataEncoder.hash(typedData.domain, types, normalizedMessage as any)).toBe(
      TypedDataEncoder.hash(typedData.domain, types, typedData.message)
    )
  })

  it('leaves addresses, bytes and non-uint fields untouched', () => {
    const types = {
      Mail: [
        { name: 'from', type: 'address' },
        { name: 'contents', type: 'bytes' },
        { name: 'hash', type: 'bytes32' },
        { name: 'delta', type: 'int256' },
        { name: 'note', type: 'string' }
      ]
    }
    const message = {
      from: '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE',
      contents: '0x0a',
      hash: `0x${'ab'.repeat(32)}`,
      delta: '0x05',
      note: '0x10'
    }

    expect(toDecimalUintFields('Mail', message, types)).toEqual(message)
  })

  it('handles nested structs, arrays and bigint values', () => {
    const types = {
      Order: [
        { name: 'amounts', type: 'uint256[]' },
        { name: 'items', type: 'Item[2]' }
      ],
      Item: [{ name: 'id', type: 'uint64' }]
    }
    const message = {
      amounts: ['0x0a', 11n, '12'],
      items: [{ id: '0xff' }, { id: 3 }]
    }

    expect(toDecimalUintFields('Order', message, types)).toEqual({
      amounts: ['10', '11', '12'],
      items: [{ id: '255' }, { id: 3 }]
    })
  })

  it('leaves malformed values for the wallet to reject instead of throwing', () => {
    const types = {
      Data: [
        { name: 'amount', type: 'uint256' },
        { name: 'list', type: 'uint8[]' }
      ]
    }

    expect(toDecimalUintFields('Data', { amount: '0x', list: 'not-an-array' }, types)).toEqual({
      amount: '0x',
      list: 'not-an-array'
    })
    expect(toDecimalUintFields('Data', { amount: '0xzz' }, types)).toEqual({ amount: '0xzz' })
    expect(toDecimalUintFields('Data', null, types)).toBe(null)
    expect(toDecimalUintFields('Unknown', { amount: '0x01' }, types)).toEqual({ amount: '0x01' })
  })

  it('converts hex with an uppercase prefix or uppercase digits', () => {
    const types = {
      Data: [
        { name: 'upperPrefix', type: 'uint256' },
        { name: 'upperDigits', type: 'uint256' },
        { name: 'upperPrefixEmpty', type: 'uint256' }
      ]
    }

    expect(
      toDecimalUintFields(
        'Data',
        { upperPrefix: '0X07', upperDigits: '0xFF', upperPrefixEmpty: '0X' },
        types
      )
    ).toEqual({ upperPrefix: '7', upperDigits: '255', upperPrefixEmpty: '0X' })
  })

  it('does not add fields that are missing from the message', () => {
    const types = { Data: [{ name: 'amount', type: 'uint256' }] }

    expect(toDecimalUintFields('Data', {}, types)).toEqual({})
  })
})
