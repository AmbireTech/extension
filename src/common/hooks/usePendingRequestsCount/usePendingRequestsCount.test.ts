import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'

import usePendingRequestsCount, { usePendingAccountAddrs } from './usePendingRequestsCount'

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

const renderPendingAddrs = (accounts: any[]) => {
  let addrs: Set<string> | undefined
  const Probe = () => {
    addrs = usePendingAccountAddrs(accounts)
    return null
  }
  act(() => {
    TestRenderer.create(React.createElement(Probe))
  })
  return Array.from(addrs!).sort()
}

describe('usePendingAccountAddrs', () => {
  const accounts = [account(SAFE, true), account(OTHER_SAFE, true), account(EOA)]

  /** The accounts the row badge gives a count above zero */
  const withPendingBadge = () =>
    accounts
      .filter((acc) => (renderCount(acc) ?? 0) > 0)
      .map((acc) => acc.addr)
      .sort()

  beforeEach(() => {
    controllerStates = {}
  })

  it('returns none and does not throw before any controller state has arrived', () => {
    expect(renderPendingAddrs(accounts)).toEqual([])

    controllerStates = {
      SelectedAccountController: {},
      AccountsController: {},
      SafeController: {},
      RequestsController: {}
    }
    expect(renderPendingAddrs(accounts)).toEqual([])
  })

  it('returns the accounts with a sign request, but not those with only other requests', () => {
    controllerStates = {
      SelectedAccountController: { account: { addr: EOA } },
      RequestsController: {
        userRequests: [
          callsRequest(EOA),
          { kind: 'dappConnect', meta: { accountAddr: SAFE } },
          { kind: 'message', meta: { accountAddr: OTHER_SAFE, pendingToRemove: true } }
        ]
      }
    }

    expect(renderPendingAddrs(accounts)).toEqual([EOA])
    expect(renderPendingAddrs(accounts)).toEqual(withPendingBadge())
  })

  it('leaves out the selected Safe when all its txns have their nonce used already', () => {
    controllerStates = {
      SelectedAccountController: { account: { addr: SAFE } },
      AccountsController: {
        accountStates: { [SAFE]: { '1': { nonce: 5n } }, [EOA]: { '1': { nonce: 9n } } }
      },
      RequestsController: {
        userRequests: [
          callsRequest(SAFE, { txnId: '0x1', nonce: 4n }),
          // The selected Safe's nonces do not apply to the other accounts
          callsRequest(EOA, { txnId: '0x2', nonce: 1n })
        ]
      }
    }

    expect(renderPendingAddrs(accounts)).toEqual([EOA])
    expect(renderPendingAddrs(accounts)).toEqual(withPendingBadge())
  })

  it('takes a Safe that is not selected from its fetched counts, not its requests on Safe servers', () => {
    controllerStates = {
      SelectedAccountController: { account: { addr: EOA } },
      SafeController: { pendingCountBySafe: { [SAFE]: { '1': 2 }, [OTHER_SAFE]: { '1': 0 } } },
      RequestsController: {
        userRequests: [
          callsRequest(OTHER_SAFE, { txnId: '0x1', nonce: 1n }),
          { kind: 'message', meta: { accountAddr: OTHER_SAFE, hash: '0xabc' } }
        ]
      }
    }

    expect(renderPendingAddrs(accounts)).toEqual([SAFE])
    expect(renderPendingAddrs(accounts)).toEqual(withPendingBadge())
  })

  it('ignores the fetched counts of the selected Safe, as its own requests are what counts', () => {
    controllerStates = {
      SelectedAccountController: { account: { addr: SAFE } },
      SafeController: { pendingCountBySafe: { [SAFE]: { '1': 3 } } }
    }

    expect(renderPendingAddrs(accounts)).toEqual([])
    expect(renderPendingAddrs(accounts)).toEqual(withPendingBadge())
  })

  it('skips malformed requests and counts instead of throwing', () => {
    controllerStates = {
      SelectedAccountController: { account: { addr: SAFE } },
      AccountsController: { accountStates: { [SAFE]: { '1': null, '137': { nonce: 5n } } } },
      SafeController: { pendingCountBySafe: { [OTHER_SAFE]: { '1': NaN, '10': 'x' } } },
      RequestsController: {
        userRequests: [
          null,
          { kind: 'message' },
          { kind: 'calls', meta: {} },
          callsRequest(SAFE, { txnId: '0x1', nonce: 'not a bigint' })
        ]
      }
    }

    expect(renderPendingAddrs(accounts)).toEqual([SAFE])
    expect(renderPendingAddrs(accounts)).toEqual(withPendingBadge())
  })
})
