import { Network } from '@ambire-common/interfaces/network'
import { CallsUserRequest } from '@ambire-common/interfaces/userRequest'

import { getSafeQueueNetworkGroups, getSafeQueueRequests, getSafeQueueStatus } from './helpers'

const ACCOUNT_ADDR = '0x0000000000000000000000000000000000000001'

const makeRequest = ({
  id,
  chainId,
  nonce,
  rejected = false,
  signed = [],
  threshold = 2,
  importedOwners = []
}: {
  id: string
  chainId: bigint
  nonce: bigint
  rejected?: boolean
  signed?: string[]
  threshold?: number
  importedOwners?: string[]
}) =>
  ({
    id,
    kind: 'calls',
    meta: { accountAddr: ACCOUNT_ADDR, chainId, isSafeRejected: rejected },
    dappPromises: [],
    signAccountOp: {
      account: { safeCreation: {} },
      accountKeyStoreKeys: importedOwners.map((addr) => ({ addr })),
      threshold,
      accountOp: {
        accountAddr: ACCOUNT_ADDR,
        chainId,
        nonce,
        txnId: `0x${id}`,
        signed
      }
    }
  }) as unknown as CallsUserRequest

const networks = [
  { chainId: 1n, name: 'Ethereum' },
  { chainId: 42161n, name: 'Arbitrum' }
] as Network[]

describe('Safe Queue helpers', () => {
  test('hides rejected transactions only after their network nonce passes them', () => {
    const requests = [
      makeRequest({ id: 'past', chainId: 1n, nonce: 17n, rejected: true }),
      makeRequest({ id: 'current', chainId: 1n, nonce: 18n, rejected: true }),
      makeRequest({ id: 'future', chainId: 1n, nonce: 19n, rejected: true })
    ]

    expect(getSafeQueueRequests(requests, ACCOUNT_ADDR, { '1': 18n }).map(({ id }) => id)).toEqual([
      'current',
      'future'
    ])
  })

  test('keeps each network timeline together and groups same-nonce transactions', () => {
    const requests = [
      makeRequest({ id: 'eth-19', chainId: 1n, nonce: 19n }),
      makeRequest({ id: 'arb-8', chainId: 42161n, nonce: 8n }),
      makeRequest({ id: 'eth-18-a', chainId: 1n, nonce: 18n }),
      makeRequest({ id: 'eth-18-b', chainId: 1n, nonce: 18n }),
      makeRequest({ id: 'arb-7', chainId: 42161n, nonce: 7n })
    ]

    const groups = getSafeQueueNetworkGroups(requests, networks)

    expect(groups.map(({ network }) => network.name)).toEqual(['Ethereum', 'Arbitrum'])
    expect(groups[0]!.nonceGroups.map(({ nonce }) => nonce)).toEqual([18n, 19n])
    expect(groups[0]!.nonceGroups[0]!.requests).toHaveLength(2)
    expect(groups[1]!.nonceGroups.map(({ nonce }) => nonce)).toEqual([7n, 8n])
  })

  test('derives the action state from imported owners and collected signatures', () => {
    const owner = '0x0000000000000000000000000000000000000002'

    expect(
      getSafeQueueStatus(
        makeRequest({ id: 'sign', chainId: 1n, nonce: 18n, importedOwners: [owner] })
      )
    ).toBe('needs-signature')
    expect(
      getSafeQueueStatus(
        makeRequest({
          id: 'wait',
          chainId: 1n,
          nonce: 18n,
          signed: [owner],
          threshold: 2,
          importedOwners: [owner]
        })
      )
    ).toBe('waiting')
    expect(
      getSafeQueueStatus(
        makeRequest({ id: 'ready', chainId: 1n, nonce: 18n, signed: [owner], threshold: 1 })
      )
    ).toBe('ready')
    expect(
      getSafeQueueStatus(makeRequest({ id: 'rejected', chainId: 1n, nonce: 18n, rejected: true }))
    ).toBe('rejected')
  })
})
