import { Transaction } from 'ethers'

import { getUnsignedTransaction } from './getUnsignedTransaction'

const txnRequest = {
  to: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
  value: 0n,
  data: '0x',
  chainId: 137n,
  nonce: 1,
  gasLimit: 21000n
}

describe('getUnsignedTransaction', () => {
  test('a max fee per gas makes an EIP-1559 transaction', () => {
    const unsignedTxn = getUnsignedTransaction({
      ...txnRequest,
      maxFeePerGas: 30000000000n,
      maxPriorityFeePerGas: 1500000000n
    })

    expect(unsignedTxn.type).toBe(2)
    expect(Transaction.from(unsignedTxn).unsignedSerialized.startsWith('0x02')).toBe(true)
  })

  test('no max fee per gas makes a legacy transaction, whatever type the request had', () => {
    const unsignedTxn = getUnsignedTransaction({ ...txnRequest, gasPrice: 1n, type: 2 })

    expect(unsignedTxn.type).toBe(0)
    expect(Transaction.from(unsignedTxn).type).toBe(0)
  })
})
