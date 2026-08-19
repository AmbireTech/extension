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

const push = (entries: StackState, pathname: string, key: string, index: number, s: any = null) =>
  reduceStack(entries, { location: loc(pathname, key, s), index, navigationType: 'PUSH' })

const pop = (entries: StackState, pathname: string, key: string, index: number) =>
  reduceStack(entries, { location: loc(pathname, key), index, navigationType: 'POP' })

const paths = (entries: StackState) => entries.map((e) => e.location.pathname)
const cardKeys = (entries: StackState) => entries.map((e) => e.cardKey)

describe('reduceStack', () => {
  const dashboard: StackState = [entry('/dashboard', 'a', 0)]

  it('pushes a new screen on top', () => {
    expect(paths(push(dashboard, '/transfer', 'b', 1))).toEqual(['/dashboard', '/transfer'])
  })

  it('pops back to the screen below', () => {
    const next = pop(push(dashboard, '/transfer', 'b', 1), '/dashboard', 'a', 0)

    expect(paths(next)).toEqual(['/dashboard'])
    // The same screen is revealed rather than rebuilt, so the native stack sees a
    // pop instead of a different screen being pushed.
    expect(cardKeys(next)).toEqual(['a'])
  })

  it('pops several levels at once', () => {
    const deep = push(push(dashboard, '/networks', 'b', 1), '/settings/general', 'c', 2)

    expect(paths(pop(deep, '/dashboard', 'a', 0))).toEqual(['/dashboard'])
  })

  it('collapses the stack when landing on a reset route', () => {
    const deep = push(push(dashboard, '/transfer', 'b', 1), '/unlock', 'c', 2)

    expect(paths(deep)).toEqual(['/unlock'])
  })

  it('updates the top screen in place when only the search params change', () => {
    const withSession = reduceStack(dashboard, {
      location: { ...loc('/dashboard', 'b'), search: '?sessionId=1' },
      index: 1,
      navigationType: 'PUSH'
    })

    expect(paths(withSession)).toEqual(['/dashboard'])
    // Same screen, so nothing is remounted and the native stack does not animate...
    expect(withSession[0]!.cardKey).toBe('a')
    // ...but it now tracks the location the history points at.
    expect(withSession[0]!.key).toBe('b')
    expect(withSession[0]!.index).toBe(1)
    expect(withSession[0]!.location.search).toBe('?sessionId=1')
  })

  it('does not stack a second screen for a redundant navigation to the current one', () => {
    const again = push(push(dashboard, '/transfer', 'b', 1), '/transfer', 'c', 2)

    expect(paths(again)).toEqual(['/dashboard', '/transfer'])
    expect(cardKeys(again)).toEqual(['a', 'b'])
  })

  it('pops onto the screen that pushed an in-place update, instead of resyncing', () => {
    // The dashboard writes its session id (index 1), then a screen is pushed on
    // top of it (index 2). Going back lands on index 1 - an entry the dashboard
    // owns but is not keyed by.
    const withSession = reduceStack(dashboard, {
      location: { ...loc('/dashboard', 'b'), search: '?sessionId=1' },
      index: 1,
      navigationType: 'PUSH'
    })
    const back = pop(push(withSession, '/receive', 'c', 2), '/dashboard', 'b', 1)

    expect(paths(back)).toEqual(['/dashboard'])
    expect(cardKeys(back)).toEqual(['a'])
  })

  it('goes home onto the screen already showing the dashboard', () => {
    const deep = push(push(dashboard, '/swap-and-bridge', 'b', 1), '/networks', 'c', 2)
    const next = push(deep, '/dashboard', 'd', 3)

    expect(paths(next)).toEqual(['/dashboard'])
    // Revealed, not rebuilt, so the dashboard keeps its state.
    expect(cardKeys(next)).toEqual(['a'])
  })

  it('starts a fresh screen when the root path is not in the stack', () => {
    const next = push(push(dashboard, '/transfer', 'b', 1), '/get-started', 'c', 2)

    expect(paths(next)).toEqual(['/get-started'])
    expect(cardKeys(next)).toEqual(['c'])
  })

  it('swaps the top screen on a replace', () => {
    const next = reduceStack(push(dashboard, '/transfer', 'b', 1), {
      location: loc('/receive', 'c'),
      index: 1,
      navigationType: 'REPLACE'
    })

    expect(paths(next)).toEqual(['/dashboard', '/receive'])
  })

  it('plays an onboarding "back" push as a pop, without duplicating the revealed screen', () => {
    const onboarding = push([entry('/get-started', 'a', 0)], '/import-existing-account', 'b', 1)
    const next = push(onboarding, '/get-started', 'c', 2, { navDirection: 'back' })

    expect(paths(next)).toEqual(['/get-started'])
    expect(cardKeys(next)).toEqual(['c'])
  })

  it('resyncs to a single screen when the history points at an entry the stack lost', () => {
    expect(paths(pop([entry('/dashboard', 'a', 4)], '/transfer', 'x', 3))).toEqual(['/transfer'])
  })
})
