import { Transaction, ZeroAddress } from 'ethers'

import { getSafeTypedData } from '@ambire-common/libs/signMessage/signMessage'

import UrQrProtocolAdapter from './UrQrProtocolAdapter'

const SIGNER = {
  derivationPath: "m/44'/60'/0'/0/0",
  masterFingerprint: 'ffffffff',
  address: '0x0000000000000000000000000000000000000001'
}

const getSafeTxTypedData = (dataBytes: number) =>
  getSafeTypedData(10n, '0xa60000000000000000000000000000000000ced5', {
    to: '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE',
    value: '0x00',
    data: `0x${'ab'.repeat(dataBytes)}`,
    operation: 1,
    safeTxGas: '0x00',
    baseGas: '0x00',
    gasPrice: '0x00',
    gasToken: ZeroAddress as `0x${string}`,
    refundReceiver: ZeroAddress as `0x${string}`,
    nonce: '0x07'
  })

const getUnsignedTxHex = (dataBytes: number) =>
  Transaction.from({
    type: 2,
    chainId: 10,
    nonce: 0,
    to: '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE',
    data: `0x${'ab'.repeat(dataBytes)}`,
    maxFeePerGas: 1n,
    maxPriorityFeePerGas: 1n,
    gasLimit: 21000n
  }).unsignedSerialized

describe('UrQrProtocolAdapter - requests too large for the device', () => {
  const adapter = new UrQrProtocolAdapter()

  // Sizes seen on a Keystone 3 Pro: a 68 byte Safe transfer signed, a 3684 byte Safe swap was rejected
  it('does not flag a Safe transfer', async () => {
    const request = await adapter.buildSignTypedDataRequest({
      ...SIGNER,
      typedData: getSafeTxTypedData(68)
    })

    expect(request.isTooLargeForDevice).toBe(false)
  })

  it('flags a Safe swap too large for the device to show', async () => {
    const request = await adapter.buildSignTypedDataRequest({
      ...SIGNER,
      typedData: getSafeTxTypedData(3684)
    })

    expect(request.isTooLargeForDevice).toBe(true)
  })

  // A regular swap of this size signed fine: transactions have no display limit
  it('does not flag a regular transaction with the same amount of data', async () => {
    const request = await adapter.buildSignTransactionRequest({
      ...SIGNER,
      txHex: getUnsignedTxHex(3684),
      chainId: 10n,
      type: 2
    })

    expect(request.isTooLargeForDevice).toBe(false)
  })

  it('flags a transaction too large for the device to scan', async () => {
    const request = await adapter.buildSignTransactionRequest({
      ...SIGNER,
      txHex: getUnsignedTxHex(15 * 1024),
      chainId: 10n,
      type: 2
    })

    expect(request.isTooLargeForDevice).toBe(true)
  })

  it('does not flag a short message and flags one too large to scan', async () => {
    const shortMessage = await adapter.buildSignMessageRequest({ ...SIGNER, hex: '0x68656c6c6f' })
    const hugeMessage = await adapter.buildSignMessageRequest({
      ...SIGNER,
      hex: `0x${'ab'.repeat(15 * 1024)}`
    })

    expect(shortMessage.isTooLargeForDevice).toBe(false)
    expect(hugeMessage.isTooLargeForDevice).toBe(true)
  })
})
