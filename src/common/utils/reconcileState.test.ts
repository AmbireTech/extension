import { parse, stringify } from '@ambire-common/libs/richJson/richJson'

import { detachState, isEqualSnapshot, reconcileState } from './reconcileState'

// `reconcileState` stands in for the richJson round trip the port-based platforms
// get, so the two have to agree on values, and it has to detach the snapshot from the
// controller's live objects while keeping the top-level values that did not change.
describe('reconcileState', () => {
  describe('detaching the snapshot from the live controller state', () => {
    it('does not alias a nested object of the source, so a later in-place mutation cannot reach the snapshot', () => {
      const live = { statuses: { signing: 'INITIAL' }, balance: 1n }

      const snapshot = reconcileState(undefined, live)
      live.statuses.signing = 'SIGNING'

      expect(snapshot.statuses.signing).toBe('INITIAL')
      expect(snapshot.statuses).not.toBe(live.statuses)
    })

    it('reports a change after an in-place mutation, which is the case a shallow copy gets wrong', () => {
      const live = { statuses: { signing: 'INITIAL' } }
      const first = reconcileState(undefined, live)

      live.statuses.signing = 'SIGNING'
      const second = reconcileState(first, live)

      expect(second).not.toBe(first)
      expect(second.statuses.signing).toBe('SIGNING')
      // The previous snapshot has to stay at the old value or a deep comparison
      // between the two would report them equal.
      expect(first.statuses.signing).toBe('INITIAL')
    })

    it('detaches deeply nested arrays of objects', () => {
      const live = { accounts: [{ addr: '0xA', tokens: [{ symbol: 'ETH' }] }] }

      const snapshot = reconcileState(undefined, live)
      live.accounts[0]!.tokens[0]!.symbol = 'DAI'

      expect(snapshot.accounts[0]!.tokens[0]!.symbol).toBe('ETH')
    })

    it('leaves the controller state it was given untouched', () => {
      const err: any = new Error('boom')
      err.code = 'E_BOOM'
      const nested = { signing: 'INITIAL' }
      const tokens = [{ symbol: 'ETH', amount: 1n }]
      const live = { statuses: nested, tokens, err, fn: () => {} }

      const before = stringify({ ...live, fn: undefined })
      reconcileState(undefined, live)

      expect(live.statuses).toBe(nested)
      expect(live.tokens).toBe(tokens)
      expect(live.err).toBe(err)
      expect(typeof live.fn).toBe('function')
      expect(stringify({ ...live, fn: undefined })).toBe(before)
    })
  })

  describe('reuse, which stops at the top level', () => {
    it('returns the previous snapshot itself when an emit carried no change', () => {
      const live = { a: 1, nested: { b: 2 }, list: [1, 2, 3] }

      const first = reconcileState(undefined, live)
      const second = reconcileState(first, live)

      expect(second).toBe(first)
    })

    it('keeps the top-level values that did not change and replaces only the one that did', () => {
      const live = {
        portfolio: { total: 10 },
        activity: { txns: [{ hash: '0x1' }] },
        keystore: { isUnlocked: true }
      }

      const first = reconcileState(undefined, live)
      live.portfolio.total = 20
      const second = reconcileState(first, live)

      expect(second).not.toBe(first)
      expect(second.portfolio).not.toBe(first.portfolio)
      // Untouched siblings keep their identity, which is what lets useMemo and
      // React.memo skip work downstream.
      expect(second.activity).toBe(first.activity)
      expect(second.activity.txns).toBe(first.activity.txns)
      expect(second.keystore).toBe(first.keystore)
    })

    it('gives the whole top-level value a new identity when something deep inside it changed', () => {
      const live = { activity: { txns: [{ hash: '0x1' }, { hash: '0x2' }] } }

      const first = reconcileState(undefined, live)
      live.activity.txns[1]!.hash = '0x3'
      const second = reconcileState(first, live)

      expect(second.activity).not.toBe(first.activity)
      // Reuse is top-level only, so the item that did not change is rebuilt too and
      // its consumers re-render. Accepted, in exchange for never missing a change.
      expect(second.activity.txns[0]).not.toBe(first.activity.txns[0])
      expect(second.activity.txns[0]).toEqual(first.activity.txns[0])
      expect(second.activity.txns[1]!.hash).toBe('0x3')
      expect(first.activity.txns[1]!.hash).toBe('0x2')
    })

    it('treats a removed key as a change', () => {
      const live: Record<string, unknown> = { a: 1, b: 2 }

      const first = reconcileState(undefined, live)
      delete live.b
      const second = reconcileState(first, live)

      expect(second).not.toBe(first)
      expect('b' in (second as object)).toBe(false)
    })

    it('treats an added key as a change', () => {
      const live: Record<string, unknown> = { a: 1 }

      const first = reconcileState(undefined, live)
      live.b = 2
      const second = reconcileState(first, live)

      expect(second).not.toBe(first)
      expect((second as any).b).toBe(2)
    })

    it('treats a shorter array as a change even when the surviving items match', () => {
      const live = { txns: [{ hash: '0x1' }, { hash: '0x2' }] }

      const first = reconcileState(undefined, live)
      live.txns.pop()
      const second = reconcileState(first, live)

      expect(second).not.toBe(first)
      expect(second.txns).toHaveLength(1)
    })

    it('does not report a change for a NaN that stayed NaN', () => {
      const live = { rate: NaN }

      const first = reconcileState(undefined, live)
      const second = reconcileState(first, live)

      expect(second).toBe(first)
    })

    it('reconciles a state that is not a plain object by value', () => {
      const first = reconcileState(undefined, [{ hash: '0x1' }])
      const second = reconcileState(first, [{ hash: '0x1' }])
      const third = reconcileState(second, [{ hash: '0x2' }])

      expect(second).toBe(first)
      expect(third).not.toBe(second)
      expect(third[0]!.hash).toBe('0x2')
    })
  })

  describe('value handling, matching the richJson round trip', () => {
    const expectMatchesRichJson = (value: object) => {
      expect(reconcileState(undefined, value)).toEqual(parse(stringify(value)))
    }

    it('keeps BigInt as BigInt', () => {
      const snapshot = reconcileState(undefined, { balance: 12345678901234567890n })

      expect(snapshot.balance).toBe(12345678901234567890n)
      expectMatchesRichJson({ balance: 12345678901234567890n })
    })

    it('drops functions, symbols and undefined from objects', () => {
      const live = { a: 1, fn: () => {}, sym: Symbol('s'), missing: undefined }

      const snapshot = reconcileState(undefined, live) as Record<string, unknown>

      expect(Object.keys(snapshot)).toEqual(['a'])
      expectMatchesRichJson(live)
    })

    it('turns functions and undefined inside arrays into null', () => {
      const live = { list: [1, undefined, () => {}, 2] }

      const snapshot = reconcileState(undefined, live)

      expect(snapshot.list).toEqual([1, null, null, 2])
      expectMatchesRichJson(live)
    })

    it('rebuilds an Error with its own properties and keeps it an Error', () => {
      const err: any = new Error('boom')
      err.code = 'E_BOOM'

      const snapshot = reconcileState(undefined, { err })

      expect(snapshot.err).toBeInstanceOf(Error)
      expect(snapshot.err).not.toBe(err)
      expect(snapshot.err.message).toBe('boom')
      expect((snapshot.err as any).code).toBe('E_BOOM')
    })

    it('reuses an unchanged Error instead of rebuilding it every emit', () => {
      const err = new Error('boom')

      const first = reconcileState(undefined, { err })
      const second = reconcileState(first, { err })

      expect(second).toBe(first)
    })

    it('reports a change when an error was replaced by one carrying another message', () => {
      const first = reconcileState(undefined, { err: new Error('insufficient funds') })
      const second = reconcileState(first, { err: new Error('nonce too low') })

      expect(second).not.toBe(first)
      expect(second.err.message).toBe('nonce too low')
      expect(first.err.message).toBe('insufficient funds')
    })

    it('detaches an object hanging off an Error, so a later mutation cannot reach the snapshot', () => {
      const err: any = new Error('rpc call failed')
      err.request = { chainId: 1n, method: 'eth_call' }

      const snapshot = reconcileState(undefined, { err }) as any
      err.request.method = 'eth_estimateGas'

      expect(snapshot.err.request).not.toBe(err.request)
      expect(snapshot.err.request.method).toBe('eth_call')
      expect(snapshot.err.request.chainId).toBe(1n)
    })

    it('reports a change when only a nested prop of an Error was mutated in place', () => {
      const err: any = new Error('rpc call failed')
      err.request = { method: 'eth_call' }

      const first = reconcileState(undefined, { err }) as any
      err.request.method = 'eth_estimateGas'
      const second = reconcileState(first, { err }) as any

      expect(second).not.toBe(first)
      expect(second.err.request.method).toBe('eth_estimateGas')
      // The previous snapshot has to stay at the old value or a consumer holding on
      // to it would see the new one and report the two equal.
      expect(first.err.request.method).toBe('eth_call')
    })

    it('reuses an Error whose nested props did not change', () => {
      const err: any = new Error('rpc call failed')
      err.request = { method: 'eth_call' }

      const first = reconcileState(undefined, { err }) as any
      const second = reconcileState(first, { err }) as any

      expect(second).toBe(first)
      expect(second.err.request).toBe(first.err.request)
    })

    it('drops a function hanging off an Error, matching how object keys are handled', () => {
      const err: any = new Error('boom')
      err.retry = () => {}
      err.code = 'E_BOOM'

      const snapshot = reconcileState(undefined, { err }) as any

      expect('retry' in snapshot.err).toBe(false)
      expect(snapshot.err.code).toBe('E_BOOM')
    })

    it('throws on a cycle that runs through an Error prop, when detection is on', () => {
      const err: any = new Error('boom')
      err.context = { err }

      expect(() =>
        reconcileState(undefined, { err }, { label: 'MainController', detectCycles: true })
      ).toThrow(/Circular reference in MainController state/)
    })

    it('honors toJSON, which is how controllers expose their state', () => {
      const live = {
        ctrl: {
          hidden: 'should not survive',
          toJSON: () => ({ visible: 'yes' })
        }
      }

      const snapshot = reconcileState(undefined, live) as any

      expect(snapshot.ctrl).toEqual({ visible: 'yes' })
    })

    it('honors a toJSON that returns a primitive', () => {
      const live = { amount: { value: 5n, toJSON: () => '5' } }

      const snapshot = reconcileState(undefined, live) as any

      expect(snapshot.amount).toBe('5')
    })

    it('keeps null, and keeps it distinct from a dropped key', () => {
      const snapshot = reconcileState(undefined, { a: null, b: undefined }) as Record<
        string,
        unknown
      >

      expect(snapshot.a).toBeNull()
      expect('b' in snapshot).toBe(false)
    })
  })

  describe('cycles', () => {
    it('throws naming the controller rather than hanging, when detection is on', () => {
      const live: any = { name: 'portfolio' }
      live.self = live

      expect(() =>
        reconcileState(undefined, live, { label: 'PortfolioController', detectCycles: true })
      ).toThrow(/Circular reference in PortfolioController state/)
    })

    it('allows the same object to appear in two sibling branches', () => {
      const shared = { addr: '0xA' }
      const live = { left: shared, right: shared }

      const snapshot = reconcileState(undefined, live, { detectCycles: true })

      expect(snapshot.left).toEqual({ addr: '0xA' })
      expect(snapshot.right).toEqual({ addr: '0xA' })
    })
  })
})

describe('detachState', () => {
  it('copies every level, so no object is shared with the source', () => {
    const live = { accounts: [{ addr: '0xA', prefs: { label: 'Main' } }] }

    const copy = detachState(live)

    expect(copy).toEqual(live)
    expect(copy).not.toBe(live)
    expect(copy.accounts).not.toBe(live.accounts)
    expect(copy.accounts[0]).not.toBe(live.accounts[0])
    expect(copy.accounts[0]!.prefs).not.toBe(live.accounts[0]!.prefs)
  })

  it('builds a new copy on every call, even when nothing changed', () => {
    const live = { a: 1 }

    expect(detachState(live)).not.toBe(detachState(live))
  })

  it('does not read the previous snapshot, so it cannot be fooled by a live object', () => {
    const live = { tokens: [{ amount: 1n }] }

    const first = detachState(live)
    live.tokens[0]!.amount = 2n
    const second = detachState(live)

    expect(first.tokens[0]!.amount).toBe(1n)
    expect(second.tokens[0]!.amount).toBe(2n)
  })
})

describe('isEqualSnapshot', () => {
  it('compares primitives, including BigInt and NaN', () => {
    expect(isEqualSnapshot(1, 1)).toBe(true)
    expect(isEqualSnapshot(1, 2)).toBe(false)
    expect(isEqualSnapshot(1n, 1n)).toBe(true)
    expect(isEqualSnapshot(1n, 2n)).toBe(false)
    expect(isEqualSnapshot(1, 1n)).toBe(false)
    expect(isEqualSnapshot(NaN, NaN)).toBe(true)
    expect(isEqualSnapshot(NaN, 0)).toBe(false)
    expect(isEqualSnapshot(null, undefined)).toBe(false)
    expect(isEqualSnapshot('0xA', '0xA')).toBe(true)
  })

  it('compares objects by content, whatever the nesting', () => {
    expect(isEqualSnapshot({ a: { b: [1, 2] } }, { a: { b: [1, 2] } })).toBe(true)
    expect(isEqualSnapshot({ a: { b: [1, 2] } }, { a: { b: [1, 3] } })).toBe(false)
    expect(isEqualSnapshot({ a: 1 }, { a: 1, b: 2 })).toBe(false)
    expect(isEqualSnapshot({ a: 1, b: 2 }, { a: 1 })).toBe(false)
    expect(isEqualSnapshot({ a: undefined }, { b: undefined })).toBe(false)
  })

  it('does not confuse an array with an object holding the same indexes', () => {
    expect(isEqualSnapshot([1, 2], { 0: 1, 1: 2 })).toBe(false)
    expect(isEqualSnapshot([1, 2], [1, 2, 3])).toBe(false)
  })

  it('compares an error by its message and stack, which no key walk reaches', () => {
    const err = new Error('boom')
    const same = new Error('boom')
    same.stack = err.stack
    const other = new Error('other')
    other.stack = err.stack

    expect(isEqualSnapshot(err, same)).toBe(true)
    expect(isEqualSnapshot(err, other)).toBe(false)
    expect(isEqualSnapshot(err, { message: 'boom' })).toBe(false)
  })

  it('compares the own properties hanging off an error', () => {
    const err: any = new Error('rpc call failed')
    err.request = { method: 'eth_call' }
    const same: any = new Error('rpc call failed')
    same.stack = err.stack
    same.request = { method: 'eth_call' }
    const other: any = new Error('rpc call failed')
    other.stack = err.stack
    other.request = { method: 'eth_estimateGas' }

    expect(isEqualSnapshot(err, same)).toBe(true)
    expect(isEqualSnapshot(err, other)).toBe(false)
  })
})
