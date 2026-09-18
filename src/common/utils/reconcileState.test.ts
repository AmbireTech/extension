import { parse, stringify } from '@ambire-common/libs/richJson/richJson'

import { detachState, reconcileState } from './reconcileState'

// `reconcileState` stands in for the richJson round trip the port-based platforms
// get, so the two have to agree on values, and it has to detach the snapshot from the
// controller's live objects while keeping the identity of every node that did not
// change. Reuse is asserted with `toBe` throughout: a node coming back identical is
// the whole point, since that is what a subscriber checks before re-rendering.
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

  describe('reuse, which shares every node that did not change', () => {
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

    it('gives a new identity only to the nodes on the path down to the change', () => {
      const live = { activity: { txns: [{ hash: '0x1' }, { hash: '0x2' }] } }

      const first = reconcileState(undefined, live)
      live.activity.txns[1]!.hash = '0x3'
      const second = reconcileState(first, live)

      // Everything from the root down to the item that moved has to be new, or a
      // consumer reading it would keep the value it already had.
      expect(second).not.toBe(first)
      expect(second.activity).not.toBe(first.activity)
      expect(second.activity.txns).not.toBe(first.activity.txns)
      expect(second.activity.txns[1]).not.toBe(first.activity.txns[1])
      // The item beside it did not change, so it keeps its identity and whatever
      // renders it does not re-render because its neighbour moved.
      expect(second.activity.txns[0]).toBe(first.activity.txns[0])
      expect(second.activity.txns[1]!.hash).toBe('0x3')
      expect(first.activity.txns[1]!.hash).toBe('0x2')
    })

    it('shares every sibling of a changed item, which is the case a long list hits', () => {
      const live = {
        tokens: Array.from({ length: 200 }, (_, index) => ({ symbol: `T${index}`, amount: 1n }))
      }

      const first = reconcileState(undefined, live)
      live.tokens[137]!.amount = 2n
      const second = reconcileState(first, live)

      const rebuilt = second.tokens.filter((token, index) => token !== first.tokens[index])

      expect(second.tokens).not.toBe(first.tokens)
      expect(rebuilt).toEqual([{ symbol: 'T137', amount: 2n }])
      expect(first.tokens[137]!.amount).toBe(1n)
    })

    it('shares the branches a portfolio update did not touch, chain by chain', () => {
      const live = {
        latest: {
          '0xACC': {
            '1': { tokens: [{ symbol: 'ETH', amount: 1n }], isLoading: false },
            '137': { tokens: [{ symbol: 'MATIC', amount: 2n }], isLoading: false }
          },
          '0xOTHER': { '1': { tokens: [{ symbol: 'ETH', amount: 3n }], isLoading: false } }
        }
      }

      const first = reconcileState(undefined, live)
      live.latest['0xACC']!['1']!.tokens[0]!.amount = 5n
      const second = reconcileState(first, live)

      // The path down to the one chain that changed.
      expect(second.latest).not.toBe(first.latest)
      expect(second.latest['0xACC']).not.toBe(first.latest['0xACC'])
      expect(second.latest['0xACC']!['1']).not.toBe(first.latest['0xACC']!['1'])
      // The other chain and the other account are untouched, which is what stops one
      // network finishing from re-rendering the rows of all the others.
      expect(second.latest['0xACC']!['137']).toBe(first.latest['0xACC']!['137'])
      expect(second.latest['0xACC']!['137']!.tokens).toBe(first.latest['0xACC']!['137']!.tokens)
      expect(second.latest['0xOTHER']).toBe(first.latest['0xOTHER'])
    })

    it('still shares the surviving items when the array itself got shorter', () => {
      const live = { txns: [{ hash: '0x1' }, { hash: '0x2' }, { hash: '0x3' }] }

      const first = reconcileState(undefined, live)
      live.txns.pop()
      const second = reconcileState(first, live)

      expect(second.txns).not.toBe(first.txns)
      expect(second.txns[0]).toBe(first.txns[0])
      expect(second.txns[1]).toBe(first.txns[1])
    })

    it('reports a change for a value that only looks equal, whatever its type', () => {
      const cases: { label: string; before: unknown; after: unknown }[] = [
        { label: 'number', before: 1, after: 2 },
        { label: 'bigint', before: 1n, after: 2n },
        { label: 'number against bigint', before: 1, after: 1n },
        { label: 'NaN against a number', before: NaN, after: 0 },
        { label: 'null against undefined', before: null, after: undefined },
        { label: 'string', before: '0xA', after: '0xB' },
        { label: 'nested array item', before: { b: [1, 2] }, after: { b: [1, 3] } },
        {
          label: 'array against an object holding the same indexes',
          before: [1, 2],
          after: { 0: 1, 1: 2 }
        },
        { label: 'longer array', before: [1, 2], after: [1, 2, 3] }
      ]

      cases.forEach(({ label, before, after }) => {
        const first = reconcileState(undefined, { v: before })

        // A fresh live object each time, so reuse can only come from the content.
        // The label rides along so a failure names the case that broke.
        expect({ label, reused: reconcileState(first, { v: before }) === first }).toEqual({
          label,
          reused: true
        })
        expect({ label, reused: reconcileState(first, { v: after }) === first }).toEqual({
          label,
          reused: false
        })
      })
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

    it('treats one key swapped for another as a change, though the count is the same', () => {
      const live: Record<string, unknown> = { a: 1, b: 2 }

      const first = reconcileState(undefined, live)
      delete live.b
      live.c = 2
      const second = reconcileState(first, live)

      // Equal key counts are not equal key sets, and this is the shape that slips
      // through a check that only counts them.
      expect(second).not.toBe(first)
      expect(second).toEqual({ a: 1, c: 2 })
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

  // A node the update did not touch is never built, so the object a change does need
  // is opened out of the previous snapshot rather than out of the walk. What it carries
  // for the keys and items already passed is therefore whatever `prev` held for them,
  // and one `prev` never held has to stay out of it.
  describe('rebuilding a record or an array around a change', () => {
    it('keeps the identity of the keys walked before and after the one that changed', () => {
      const live = { before: { a: 1 }, changed: { b: 1 }, after: { c: 1 } }

      const first = reconcileState(undefined, live)
      live.changed.b = 2
      const second = reconcileState(first, live)

      expect(second.before).toBe(first.before)
      expect(second.changed).not.toBe(first.changed)
      expect(second.after).toBe(first.after)
    })

    it('keeps the key order of the state, which is the order richJson would write', () => {
      // The change sits past the second key on purpose: the keys before it are the ones
      // the object is opened out of, and one key alone cannot come back out of order.
      const live: Record<string, any> = { z: 1, y: 2, m: { v: 1 }, a: 4 }

      const first = reconcileState(undefined, live)
      live.m.v = 2
      const second = reconcileState(first, live) as object

      expect(Object.keys(second)).toEqual(['z', 'y', 'm', 'a'])
      expect(stringify(second)).toBe(stringify(parse(stringify(live))))
    })

    it('leaves a dropped key out of the object a later change opens', () => {
      const live: Record<string, any> = { fn: () => {}, nested: { v: 1 } }

      const first = reconcileState(undefined, live)
      live.nested.v = 2
      const second = reconcileState(first, live) as Record<string, unknown>

      // `fn` is walked before `nested`, so the backfill reaches it - and has to skip it
      // rather than copy what `prev` holds under it, which is nothing.
      expect(Object.keys(second)).toEqual(['nested'])
      expect(second.nested).toEqual({ v: 2 })
    })

    it('shares a record that carries a function, emit after emit', () => {
      const live = { fn: () => {}, a: 1 }

      const first = reconcileState(undefined, live)
      const second = reconcileState(first, live)

      // Both snapshots drop the function, so nothing changed - and a record holding one
      // must not churn its identity on every emit because of it.
      expect(second).toBe(first)
    })

    it('treats a key that became a function as a change, since the snapshot loses it', () => {
      const live: Record<string, unknown> = { a: 1, b: 2 }

      const first = reconcileState(undefined, live)
      live.b = () => {}
      const second = reconcileState(first, live) as Record<string, unknown>

      expect(second).not.toBe(first)
      expect(Object.keys(second)).toEqual(['a'])
    })

    it('treats a key that lost its value as a change, and one that gained it back too', () => {
      const live: Record<string, unknown> = { a: 1 }

      const withValue = reconcileState(undefined, live)
      live.a = undefined
      const withoutValue = reconcileState(withValue, live)
      live.a = 1
      const withValueAgain = reconcileState(withoutValue, live)

      // A snapshot holds no `undefined` under a key, since that is exactly what it
      // drops - which is what makes reading one back mean the key is not there at all.
      expect(withoutValue).not.toBe(withValue)
      expect('a' in (withoutValue as object)).toBe(false)
      expect(withValueAgain).not.toBe(withoutValue)
      expect((withValueAgain as any).a).toBe(1)
    })

    it('keeps the identity of every surviving key when another one was removed', () => {
      const live: Record<string, any> = { kept: { v: 1 }, other: { v: 2 }, gone: 3 }

      const first = reconcileState(undefined, live)
      delete live.gone
      const second = reconcileState(first, live) as any

      // Nothing under the surviving keys moved, so only the record around them is new.
      expect(second).not.toBe(first)
      expect(second.kept).toBe((first as any).kept)
      expect(second.other).toBe((first as any).other)
      expect('gone' in second).toBe(false)
    })

    it('shares an array holding a NaN, emit after emit', () => {
      const live = { rates: [1, NaN, 3] }

      const first = reconcileState(undefined, live)
      const second = reconcileState(first, live)

      // A NaN holds the same content as itself without being identical to itself, so an
      // item kept as it is must never be put through the reference check that decides
      // whether the array around it has to be opened.
      expect(second).toBe(first)
    })

    it('keeps a NaN sitting before an item that changed', () => {
      const live = { rates: [NaN, { v: 1 }] }

      const first = reconcileState(undefined, live)
      ;(live.rates[1] as any).v = 2
      const second = reconcileState(first, live)

      expect(second.rates).not.toBe(first.rates)
      expect(second.rates[0]).toBeNaN()
      expect(second.rates[1]).toEqual({ v: 2 })
    })

    it('keeps the identity of the items before the one that changed', () => {
      const live = { txns: [{ hash: '0x1' }, { hash: '0x2' }, { hash: '0x3' }] }

      const first = reconcileState(undefined, live)
      live.txns[2]!.hash = '0x9'
      const second = reconcileState(first, live)

      expect(second.txns[0]).toBe(first.txns[0])
      expect(second.txns[1]).toBe(first.txns[1])
      expect(second.txns[2]).not.toBe(first.txns[2])
    })

    it('shares an array whose dropped item is dropped again', () => {
      const live = { list: [1, () => {}, 3] }

      const first = reconcileState(undefined, live)
      const second = reconcileState(first, live)

      // The function is a `null` in both snapshots, and that previous `null` is what the
      // comparison has to be against - the walk itself only ever sees the function.
      expect(second).toBe(first)
      expect(first.list).toEqual([1, null, 3])
    })

    it('keeps a dropped item as the null it became when a later item changed', () => {
      const live: any[] = [undefined, { v: 1 }]

      const first = reconcileState(undefined, live)
      live[1].v = 2
      const second = reconcileState(first, live)

      expect(second).not.toBe(first)
      expect(second[0]).toBeNull()
      expect(second[1]).toEqual({ v: 2 })
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

    it('honors a toJSON that returns the object it was called on', () => {
      const ctrl = {
        v: 1,
        toJSON(): unknown {
          return this
        }
      }

      const first = reconcileState(undefined, { ctrl }) as any
      const second = reconcileState(first, { ctrl }) as any

      // The one case where the value and what stands in for it are the same node, so
      // the walk has to go on to its keys instead of asking `toJSON` again.
      expect(first.ctrl).toEqual({ v: 1 })
      expect(second).toBe(first)
      expectMatchesRichJson({ ctrl })
    })

    it('walks the state own keys only, which is the set richJson would write', () => {
      const proto = { inherited: 'from the prototype' }
      const ctrl = Object.create(proto)
      ctrl.own = 1

      const first = reconcileState(undefined, { ctrl }) as any
      const second = reconcileState(first, { ctrl }) as any

      expect(Object.keys(first.ctrl)).toEqual(['own'])
      // An inherited key is outside the snapshot, so it can neither reach one nor make
      // one look changed.
      expect(second).toBe(first)
      expectMatchesRichJson({ ctrl })
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

describe('errors in a snapshot', () => {
  it('is built with the same shape richJson gives it, without capturing a fresh stack', () => {
    const err: any = new Error('rpc call failed')
    err.code = 'E_RPC'
    err.request = { method: 'eth_call' }

    const ours = (reconcileState(undefined, { err }) as any).err
    const viaRichJson = (parse(stringify({ err })) as any).err

    expect(ours).toBeInstanceOf(Error)
    expect(ours.name).toBe(viaRichJson.name)
    expect(ours.message).toBe(viaRichJson.message)
    // Copied from the source rather than captured, so it points at where the error
    // was actually thrown and not at the snapshot walk.
    expect(ours.stack).toBe(err.stack)
    expect(ours.stack).toBe(viaRichJson.stack)
    // The same properties a key walk and a `getOwnPropertyNames` walk would find on
    // the error the port-based platforms get.
    expect(Object.keys(ours).sort()).toEqual(Object.keys(viaRichJson).sort())
    expect(Object.getOwnPropertyNames(ours).sort()).toEqual(
      Object.getOwnPropertyNames(viaRichJson).sort()
    )
    // `message` and `stack` have to stay off a key walk, or two errors carrying
    // different messages would be compared by their custom props alone.
    expect(Object.getOwnPropertyDescriptor(ours, 'message')!.enumerable).toBe(false)
    expect(Object.getOwnPropertyDescriptor(ours, 'stack')!.enumerable).toBe(false)
  })

  it('reports a change for two errors carrying the same message from different places', () => {
    const first = reconcileState(undefined, { err: new Error('rpc call failed') })
    const other = new Error('rpc call failed')
    const second = reconcileState(first, { err: other })

    // Same message, different stack, which no walk over the enumerable keys reaches.
    expect(second).not.toBe(first)
    expect((second as any).err.stack).toBe(other.stack)
  })

  it('reports a change when an error and a plain object take each other place', () => {
    const withError = reconcileState(undefined, { err: new Error('boom') }) as any
    // Neither side has an enumerable key, so nothing but the error check itself
    // separates the two.
    const withObject = reconcileState(withError, { err: {} }) as any
    const backToError = reconcileState(withObject, { err: new Error('boom') }) as any

    expect(withObject).not.toBe(withError)
    expect(withObject.err).not.toBeInstanceOf(Error)
    expect(withObject.err).toEqual({})

    expect(backToError).not.toBe(withObject)
    expect(backToError.err).toBeInstanceOf(Error)
    expect(backToError.err.message).toBe('boom')
  })

  it('reports a change when an error stopped carrying one of its own props', () => {
    const withCode: any = new Error('rpc call failed')
    withCode.code = 'E_RPC'
    const withoutCode = new Error('rpc call failed')
    withoutCode.stack = withCode.stack

    const first = reconcileState(undefined, { err: withCode }) as any
    const second = reconcileState(first, { err: withoutCode }) as any

    // Same message and stack, one prop fewer, and nothing in the walk over the new
    // error's props visits the one that went away.
    expect(second).not.toBe(first)
    expect('code' in second.err).toBe(false)
  })

  it('keeps the error object itself when only a sibling changed', () => {
    const err = new Error('rpc call failed')
    const live = { err, counter: 1 }

    const first = reconcileState(undefined, live) as any
    live.counter = 2
    const second = reconcileState(first, live) as any

    expect(second).not.toBe(first)
    expect(second.counter).toBe(2)
    // Nothing about the error moved, so the snapshot must not hand out a new one.
    expect(second.err).toBe(first.err)
  })
})

describe('values that richJson cannot tell apart', () => {
  it('reuses when two states differ only in keys that are dropped anyway', () => {
    const first = reconcileState(undefined, { a: undefined, kept: 1 })
    const second = reconcileState(first, { b: undefined, kept: 1 })

    // Both sides drop their undefined key, so the snapshots really are the same and
    // reusing is what matches the richJson round trip the extension gets.
    expect(second).toBe(first)
    expect(second).toEqual({ kept: 1 })
  })

  it('reuses when a number turned into a -0, which richJson writes as a 0', () => {
    const first = reconcileState(undefined, { v: 0 })
    const second = reconcileState(first, { v: -0 })

    expect(second).toBe(first)
    expect(stringify({ v: -0 })).toBe(stringify({ v: 0 }))
  })
})

// The copy and the comparison share one walk, so the way this breaks is a node
// reported unchanged when its content moved - a stale snapshot, which no
// example-based test is likely to stumble on. The invariant that rules it out is
// that reconciling always has to produce what a plain detach of the same state
// would, whatever it chose to share, so that is asserted over randomly generated
// states and randomly chosen mutations.
describe('reconcileState against a plain detach, over random states', () => {
  const makeRandom = (seed: number) => {
    let state = seed
    return () => {
      state = (state * 1103515245 + 12345) & 0x7fffffff
      return state / 0x7fffffff
    }
  }

  const pick = <T>(random: () => number, items: T[]): T =>
    items[Math.floor(random() * items.length)]!

  const makeLeaf = (random: () => number): unknown =>
    pick(random, [
      0,
      1,
      -1,
      NaN,
      1n,
      12345678901234567890n,
      'a',
      '',
      true,
      false,
      null,
      undefined,
      () => {},
      Symbol('s'),
      Object.assign(new Error('boom'), { code: 'E' }),
      new Error('other'),
      { toJSON: () => ({ v: 1 }) },
      { toJSON: () => 'flat' }
    ])

  const makeValue = (random: () => number, depth: number): unknown => {
    if (depth <= 0 || random() < 0.35) return makeLeaf(random)

    if (random() < 0.5) {
      return Array.from({ length: Math.floor(random() * 4) }, () => makeValue(random, depth - 1))
    }

    const out: Record<string, unknown> = {}
    const keyCount = Math.floor(random() * 4)
    for (let i = 0; i < keyCount; i += 1) out[`k${i}`] = makeValue(random, depth - 1)
    return out
  }

  /** Walks to a random object or array inside `root`, or returns null. */
  const pickContainer = (random: () => number, root: unknown): any => {
    const found: any[] = []
    const walk = (node: unknown) => {
      if (!node || typeof node !== 'object') return
      found.push(node)
      if (Array.isArray(node)) {
        node.forEach(walk)
        return
      }
      Object.keys(node).forEach((key) => walk((node as any)[key]))
    }
    walk(root)
    return found.length ? pick(random, found) : null
  }

  const mutate = (random: () => number, root: unknown): void => {
    const target = pickContainer(random, root)
    if (!target) return

    if (Array.isArray(target)) {
      const choice = random()
      if (choice < 0.35) target.push(makeValue(random, 2))
      else if (choice < 0.6) target.pop()
      else if (target.length) target[Math.floor(random() * target.length)] = makeValue(random, 2)
      return
    }

    if (target instanceof Error) {
      const choice = random()
      if (choice < 0.4) target.message = `changed ${random()}`
      else if (choice < 0.7) (target as any)[`p${Math.floor(random() * 3)}`] = makeValue(random, 2)
      else Object.keys(target).forEach((key) => delete (target as any)[key])
      return
    }

    const keys = Object.keys(target)
    const choice = random()
    if (choice < 0.3 || !keys.length)
      target[`added${Math.floor(random() * 1000)}`] = makeValue(random, 2)
    else if (choice < 0.5) delete target[pick(random, keys)]
    else target[pick(random, keys)] = makeValue(random, 2)
  }

  it('produces what a detach would, whatever it shared, over 400 random cases', () => {
    const failures: { seed: number; reason: string }[] = []

    for (let seed = 1; seed <= 400; seed += 1) {
      const random = makeRandom(seed)
      const live = { root: makeValue(random, 4), extra: makeValue(random, 2) }

      const first = reconcileState(undefined, live)
      // Reconciling the very same state again must change nothing at all.
      if (reconcileState(first, live) !== first) failures.push({ seed, reason: 'not reused' })

      mutate(random, live)
      const second = reconcileState(first, live)
      const reference = detachState(live)

      // The one that matters: whatever was shared, the result has to be the state
      // as it is now, not as it was.
      try {
        expect(second).toEqual(reference)
      } catch {
        failures.push({ seed, reason: 'diverged from detachState' })
      }
    }

    expect(failures).toEqual([])
  })

  it('never lets a later mutation reach a snapshot it already handed out, over 200 random cases', () => {
    const failures: number[] = []

    for (let seed = 1; seed <= 200; seed += 1) {
      const random = makeRandom(seed * 7919)
      const live = { root: makeValue(random, 4) }

      const first = reconcileState(undefined, live)
      const before = detachState(first)

      mutate(random, live)
      reconcileState(first, live)

      // Sharing hands the previous snapshot's own objects to the new one, so a
      // mutation reaching either would corrupt both.
      try {
        expect(first).toEqual(before)
      } catch {
        failures.push(seed)
      }
    }

    expect(failures).toEqual([])
  })
})
