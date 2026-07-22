import { reconcile } from './reconcileState'

describe('reconcile', () => {
  it('returns the previous reference when the whole snapshot is deeply equal', () => {
    const prev = { account: { addr: '0x1' }, tokens: [{ symbol: 'ETH' }] }
    const next = { account: { addr: '0x1' }, tokens: [{ symbol: 'ETH' }] }

    const result = reconcile(prev, next)

    expect(result).toBe(prev)
  })

  it('returns a new top-level reference when any field changes', () => {
    const prev = { isReady: false, account: { addr: '0x1' } }
    const next = { isReady: true, account: { addr: '0x1' } }

    const result = reconcile(prev, next)

    expect(result).not.toBe(prev)
    expect(result.isReady).toBe(true)
  })

  it('preserves references of unchanged subtrees while replacing changed ones', () => {
    const prev = {
      account: { addr: '0x1' },
      portfolio: { totalBalance: 100 }
    }
    const next = {
      account: { addr: '0x1' }, // unchanged
      portfolio: { totalBalance: 200 } // changed
    }

    const result = reconcile(prev, next)

    // The unchanged subtree keeps its identity so selector subscribers skip re-render
    expect(result.account).toBe(prev.account)
    // The changed subtree is replaced
    expect(result.portfolio).not.toBe(prev.portfolio)
    expect(result.portfolio.totalBalance).toBe(200)
  })

  it('preserves unchanged array element references', () => {
    const prev = {
      tokens: [
        { symbol: 'ETH', amount: 1 },
        { symbol: 'DAI', amount: 5 }
      ]
    }
    const next = {
      tokens: [
        { symbol: 'ETH', amount: 1 },
        { symbol: 'DAI', amount: 9 }
      ]
    }

    const result = reconcile(prev, next)

    expect(result.tokens).not.toBe(prev.tokens)
    expect(result.tokens[0]).toBe(prev.tokens[0]) // unchanged element reused
    expect(result.tokens[1]).not.toBe(prev.tokens[1]) // changed element replaced
    expect(result.tokens[1]!.amount).toBe(9)
  })

  it('returns the previous array reference when the array is deeply equal', () => {
    const prev = { tokens: [{ symbol: 'ETH' }] }
    const next = { tokens: [{ symbol: 'ETH' }] }

    const result = reconcile(prev, next)

    expect(result.tokens).toBe(prev.tokens)
  })

  it('detects a change when the array length differs', () => {
    const prev = { tokens: [{ symbol: 'ETH' }] }
    const next = { tokens: [{ symbol: 'ETH' }, { symbol: 'DAI' }] }

    const result = reconcile(prev, next)

    expect(result.tokens).not.toBe(prev.tokens)
    expect(result.tokens).toHaveLength(2)
    expect(result.tokens[0]).toBe(prev.tokens[0]) // shared element still reused
  })

  it('detects an added key', () => {
    const prev: Record<string, unknown> = { a: 1 }
    const next: Record<string, unknown> = { a: 1, b: 2 }

    const result = reconcile(prev, next)

    expect(result).not.toBe(prev)
    expect(result).toEqual({ a: 1, b: 2 })
  })

  it('detects a removed key', () => {
    const prev: Record<string, unknown> = { a: 1, b: 2 }
    const next: Record<string, unknown> = { a: 1 }

    const result = reconcile(prev, next)

    expect(result).not.toBe(prev)
    expect(result).toEqual({ a: 1 })
    expect('b' in result).toBe(false)
  })

  it('handles null and primitive transitions', () => {
    expect(reconcile(null, { a: 1 })).toEqual({ a: 1 })
    expect(reconcile({ a: 1 }, null)).toBeNull()
    expect(reconcile(1, 2)).toBe(2)
    expect(reconcile('a', 'a')).toBe('a')
  })

  it('treats an object-to-array transition as a change', () => {
    const prev: any = { data: { 0: 'x' } }
    const next: any = { data: ['x'] }

    const result = reconcile(prev, next)

    expect(Array.isArray(result.data)).toBe(true)
  })

  it('handles the first update when there is no previous state', () => {
    const next = { account: { addr: '0x1' } }

    const result = reconcile(undefined, next)

    expect(result).toBe(next)
  })

  it('preserves equal bigint values without spurious change', () => {
    const prev = { balance: 5n, meta: { chainId: 1n } }
    const next = { balance: 5n, meta: { chainId: 1n } }

    const result = reconcile(prev, next)

    expect(result).toBe(prev)
  })
})
