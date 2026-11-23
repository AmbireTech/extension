// A PQ1 account approving a Safe transaction is the one PQ1 request that reaches the Safe API,
// so it must be recognized from the call data alone.

import { Interface, ZeroHash } from 'ethers'

import { isSafeApproveHashCall } from './safeApproval'

const safeInterface = new Interface(['function approveHash(bytes32 hashToApprove)'])
const erc20Interface = new Interface(['function transfer(address to, uint256 amount)'])

describe('isSafeApproveHashCall', () => {
  it('recognizes a call approving a Safe transaction', () => {
    expect(isSafeApproveHashCall(safeInterface.encodeFunctionData('approveHash', [ZeroHash]))).toBe(
      true
    )
  })

  it('recognizes it whatever the case of the call data', () => {
    const data = safeInterface.encodeFunctionData('approveHash', [ZeroHash])

    expect(isSafeApproveHashCall(data.toUpperCase().replace('0X', '0x'))).toBe(true)
  })

  it('leaves out any other call', () => {
    const transfer = erc20Interface.encodeFunctionData('transfer', [
      '0x0000000000000000000000000000000000000001',
      1n
    ])

    expect(isSafeApproveHashCall(transfer)).toBe(false)
  })

  it('leaves out a call with no data, or too short to hold a function', () => {
    expect(isSafeApproveHashCall(undefined)).toBe(false)
    expect(isSafeApproveHashCall('0x')).toBe(false)
    expect(isSafeApproveHashCall('0xd4d9')).toBe(false)
  })

  it('does not throw on malformed call data', () => {
    expect(() => isSafeApproveHashCall('not hex at all')).not.toThrow()
    expect(isSafeApproveHashCall('not hex at all')).toBe(false)
  })
})
