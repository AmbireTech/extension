import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'

import usePendingRequestsCount from './usePendingRequestsCount'

let controllerStates: Record<string, any> = {}

jest.mock('@common/hooks/useController', () => ({
  __esModule: true,
  default: (name: string, selector: (state: any) => any) => ({
    state: selector(controllerStates[name])
  })
}))

const SAFE = '0x0000000000000000000000000000000000000001'
const OTHER_SAFE = '0x0000000000000000000000000000000000000002'
const EOA = '0x0000000000000000000000000000000000000003'

const account = (addr: string, isSafe = false) =>
  ({ addr, safeCreation: isSafe ? { factoryAddr: '0x' } : null, preferences: {} }) as any

const callsRequest = (accountAddr: string, accountOp: Record<string, unknown> = {}) => ({
  kind: 'calls',
  meta: { accountAddr },
  signAccountOp: { accountOp: { chainId: 1n, nonce: null, ...accountOp } }
})

const renderCount = (forAccount: any) => {
  let count: number | undefined
  const Probe = () => {
    count = usePendingRequestsCount(forAccount)
    return null
  }
  act(() => {
    TestRenderer.create(React.createElement(Probe))
  })
  return count
}

describe('usePendingRequestsCount', () => {
  beforeEach(() => {
    controllerStates = {}
  })

  it('returns 0 and does not throw before any controller state has arrived', () => {
    controllerStates = {
      SelectedAccountController: {},
      AccountsController: {},
      SafeController: {},
      RequestsController: {}
    }

    expect(renderCount(account(SAFE, true))).toBe(0)
    expect(renderCount(account(EOA))).toBe(0)
  })

  it('returns 0 and does not throw when the controller states are undefined', () => {
    expect(renderCount(account(SAFE, true))).toBe(0)
  })

  it('skips malformed requests, account states and counts instead of throwing', () => {
    controllerStates = {
      SelectedAccountController: { account: { addr: SAFE } },
      AccountsController: {
        accountStates: { [SAFE]: { '1': null, '10': { nonce: undefined }, '137': { nonce: 5n } } }
      },
      SafeController: { pendingCountBySafe: { [OTHER_SAFE]: { '1': NaN, '10': 'x', '137': 2 } } },
      RequestsController: {
        userRequests: [
          null,
          { kind: 'message' },
          { kind: 'calls', meta: { accountAddr: SAFE } },
          { kind: 'calls', meta: { accountAddr: SAFE }, signAccountOp: {} },
          callsRequest(SAFE, { txnId: '0x1', nonce: 'not a bigint' }),
          callsRequest(SAFE, { txnId: '0x2', chainId: undefined, nonce: 1n }),
          { kind: 'message', meta: { accountAddr: OTHER_SAFE } }
        ]
      }
    }

    // All but the null, the meta-less and the other Safe's message are the selected Safe's
    expect(renderCount(account(SAFE, true))).toBe(4)
    // Its fetched count (only the valid number) plus its message, which is not on Safe's servers
    expect(renderCount(account(OTHER_SAFE, true))).toBe(3)
  })

  it('counts the sign requests of the account on all chains', () => {
    controllerStates = {
      SelectedAccountController: { account: { addr: EOA } },
      RequestsController: {
        userRequests: [
          callsRequest(EOA),
          callsRequest(EOA, { chainId: 10n }),
          { kind: 'typedMessage', meta: { accountAddr: EOA } },
          { kind: 'dappConnect', meta: {} },
          { kind: 'message', meta: { accountAddr: EOA, pendingToRemove: true } },
          callsRequest(SAFE)
        ]
      }
    }

    expect(renderCount(account(EOA))).toBe(3)
  })

  it('leaves out the selected Safe txns whose nonce has already been used', () => {
    controllerStates = {
      SelectedAccountController: { account: { addr: SAFE } },
      AccountsController: { accountStates: { [SAFE]: { '1': { nonce: 5n } } } },
      RequestsController: {
        userRequests: [
          callsRequest(SAFE, { txnId: '0x1', nonce: 4n }),
          callsRequest(SAFE, { txnId: '0x2', nonce: 5n }),
          callsRequest(SAFE, { txnId: '0x3', nonce: 6n }),
          callsRequest(SAFE)
        ]
      }
    }

    expect(renderCount(account(SAFE, true))).toBe(3)
  })

  it('counts a Safe that is not selected from its fetched counts, without its requests on Safe servers', () => {
    controllerStates = {
      SelectedAccountController: { account: { addr: EOA } },
      SafeController: { pendingCountBySafe: { [SAFE]: { '1': 2, '10': 1 } } },
      RequestsController: {
        userRequests: [
          callsRequest(SAFE, { txnId: '0x1', nonce: 1n }),
          { kind: 'message', meta: { accountAddr: SAFE, hash: '0xabc' } },
          callsRequest(SAFE),
          { kind: 'message', meta: { accountAddr: SAFE } }
        ]
      }
    }

    expect(renderCount(account(SAFE, true))).toBe(5)
  })
})
