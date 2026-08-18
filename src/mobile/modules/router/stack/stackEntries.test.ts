import type { Location } from 'react-router-native'

import { reduceStack, StackState } from './stackEntries'

const loc = (pathname: string, key: string, state: any = null): Location => ({
  pathname,
  search: '',
  hash: '',
  state,
  key
})

const entry = (pathname: string, key: string, index: number, state: any = null) => ({
  cardKey: key,
  key,
  location: loc(pathname, key, state),
  index,
  firstIndex: index
})

const push = (state: StackState, pathname: string, key: string, index: number, s: any = null) =>
  reduceStack(state, {
    location: loc(pathname, key, s),
    index,
    navigationType: 'PUSH'
  })

const pop = (state: StackState, pathname: string, key: string, index: number) =>
  reduceStack(state, { location: loc(pathname, key, index), index, navigationType: 'POP' })

const paths = (state: StackState) => state.entries.map((e) => e.location.pathname)

describe('reduceStack', () => {
  const dashboard: StackState = { entries: [entry('/dashboard', 'a', 0)], closing: [] }

  it('pushes a new card on top', () => {
    const next = push(dashboard, '/transfer', 'b', 1)

    expect(paths(next)).toEqual(['/dashboard', '/transfer'])
    expect(next.closing).toEqual([])
  })

  it('pops back to the card below and keeps the popped one for the exit animation', () => {
    const next = pop(push(dashboard, '/transfer', 'b', 1), '/dashboard', 'a', 0)

    expect(paths(next)).toEqual(['/dashboard'])
    expect(next.closing.map((e) => e.key)).toEqual(['b'])
  })

  it('pops several levels at once', () => {
    const deep = push(push(dashboard, '/networks', 'b', 1), '/settings/general', 'c', 2)
    const next = pop(deep, '/dashboard', 'a', 0)

    expect(paths(next)).toEqual(['/dashboard'])
    expect(next.closing.map((e) => e.key)).toEqual(['c'])
  })

  it('collapses the stack when landing on a reset route', () => {
    const deep = push(push(dashboard, '/transfer', 'b', 1), '/unlock', 'c', 2)

    expect(paths(deep)).toEqual(['/unlock'])
    expect(deep.closing).toEqual([])
  })

  it('updates the top card in place when only the search params change', () => {
    const withSession = reduceStack(dashboard, {
      location: { ...loc('/dashboard', 'b'), search: '?sessionId=1' },
      index: 1,
      navigationType: 'PUSH'
    })

    expect(paths(withSession)).toEqual(['/dashboard'])
    expect(withSession.closing).toEqual([])
    // Same card, so the screen inside it is not remounted...
    expect(withSession.entries[0]!.cardKey).toBe('a')
    // ...but it now tracks the location the history points at.
    expect(withSession.entries[0]!.key).toBe('b')
    expect(withSession.entries[0]!.index).toBe(1)
    expect(withSession.entries[0]!.location.search).toBe('?sessionId=1')
  })

  it('does not stack a second card for a redundant navigation to the current screen', () => {
    const transfer = push(dashboard, '/transfer', 'b', 1)
    const again = push(transfer, '/transfer', 'c', 2)

    expect(paths(again)).toEqual(['/dashboard', '/transfer'])
    expect(again.entries[1]!.cardKey).toBe('b')
    expect(again.closing).toEqual([])
  })

  it('pops onto the card that pushed an in-place update, instead of resyncing', () => {
    // The dashboard writes its session id (index 1), then a screen is pushed on
    // top of it (index 2). Going back lands on index 1 - an entry the dashboard
    // card owns but is not keyed by.
    const withSession = reduceStack(dashboard, {
      location: { ...loc('/dashboard', 'b'), search: '?sessionId=1' },
      index: 1,
      navigationType: 'PUSH'
    })
    const receive = push(withSession, '/receive', 'c', 2)
    const back = pop(receive, '/dashboard', 'b', 1)

    expect(paths(back)).toEqual(['/dashboard'])
    expect(back.entries[0]!.cardKey).toBe('a')
    expect(back.closing.map((e) => e.cardKey)).toEqual(['c'])
  })

  it('animates home when a screen navigates to the dashboard instead of popping', () => {
    const deep = push(push(dashboard, '/swap-and-bridge', 'b', 1), '/networks', 'c', 2)
    const next = push(deep, '/dashboard', 'd', 3)

    expect(paths(next)).toEqual(['/dashboard'])
    expect(next.closing.map((e) => e.key)).toEqual(['c'])
    // The dashboard card that was already in the stack is revealed, not rebuilt,
    // so the screen keeps its state instead of remounting.
    expect(next.entries[0]!.cardKey).toBe('a')
  })

  it('keeps every card that is on its way out', () => {
    const deep = push(push(dashboard, '/transfer', 'b', 1), '/receive', 'c', 2)
    const firstBack = pop(deep, '/transfer', 'b', 1)
    // Popped again before the first card finished animating away.
    const secondBack = pop(firstBack, '/dashboard', 'a', 0)

    expect(paths(secondBack)).toEqual(['/dashboard'])
    expect(secondBack.closing.map((e) => e.cardKey)).toEqual(['c', 'b'])
  })

  it('collapses without an animation when the root path is not in the stack', () => {
    const next = push(push(dashboard, '/transfer', 'b', 1), '/get-started', 'c', 2)

    expect(paths(next)).toEqual(['/get-started'])
    expect(next.closing).toEqual([])
  })

  it('swaps the top card on a replace', () => {
    const next = reduceStack(push(dashboard, '/transfer', 'b', 1), {
      location: loc('/receive', 'c'),
      index: 1,
      navigationType: 'REPLACE'
    })

    expect(paths(next)).toEqual(['/dashboard', '/receive'])
  })

  it('plays an onboarding "back" push as a pop, without duplicating the revealed card', () => {
    const onboarding = push(
      { entries: [entry('/get-started', 'a', 0)], closing: [] },
      '/import-existing-account',
      'b',
      1
    )
    const next = push(onboarding, '/get-started', 'c', 2, { navDirection: 'back' })

    expect(paths(next)).toEqual(['/get-started'])
    expect(next.entries[0]!.key).toBe('c')
    expect(next.closing.map((e) => e.key)).toEqual(['b'])
  })

  it('resyncs to a single card when the history points at an entry the stack no longer has', () => {
    const afterReset: StackState = { entries: [entry('/dashboard', 'a', 4)], closing: [] }
    const next = pop(afterReset, '/transfer', 'x', 3)

    expect(paths(next)).toEqual(['/transfer'])
    expect(next.closing).toEqual([])
  })
})
