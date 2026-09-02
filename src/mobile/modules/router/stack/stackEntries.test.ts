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
  firstIndex: index,
  replaceAnimation: 'push' as const
})

const push = (entries: StackState, pathname: string, key: string, index: number, s: any = null) =>
  reduceStack(entries, { location: loc(pathname, key, s), index, navigationType: 'PUSH' })

const pop = (entries: StackState, pathname: string, key: string, index: number) =>
  reduceStack(entries, { location: loc(pathname, key), index, navigationType: 'POP' })

const replace = (entries: StackState, pathname: string, key: string, index: number) =>
  reduceStack(entries, { location: loc(pathname, key), index, navigationType: 'REPLACE' })

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

  it('plays an onboarding "back" push as a pop, revealing the screen it returns to', () => {
    const onboarding = push([entry('/get-started', 'a', 0)], '/import-existing-account', 'b', 1)
    const next = push(onboarding, '/get-started', 'c', 2, { navDirection: 'back' })

    expect(paths(next)).toEqual(['/get-started'])
    // Revealed, not rebuilt, so the step keeps what the user typed into it.
    expect(cardKeys(next)).toEqual(['a'])
  })

  it('resyncs to a single screen when the history points at an entry the stack lost', () => {
    expect(paths(pop([entry('/dashboard', 'a', 4)], '/transfer', 'x', 3))).toEqual(['/transfer'])
  })

  describe('the redirect hub', () => {
    it('has no card of its own on boot, so the first real route is the first card', () => {
      const booting = push([], '/', 'a', 0)

      expect(booting).toEqual([])

      const first = replace(booting, '/unlock', 'b', 0)

      expect(paths(first)).toEqual(['/unlock'])
    })

    it('keeps the screen the user is on, and only follows the history', () => {
      const next = push([entry('/unlock', 'a', 0)], '/', 'b', 1)

      expect(paths(next)).toEqual(['/unlock'])
      expect(next[0]!.cardKey).toBe('a')
      // Answers for the location the history now points at, so the stack settles.
      expect(next[0]!.key).toBe('b')
      expect(next[0]!.index).toBe(1)
      expect(next[0]!.firstIndex).toBe(0)
    })

    it('turns unlocking into a single forward transition to the dashboard', () => {
      const unlocked = replace([entry('/unlock', 'a', 0)], '/', 'b', 0)
      const next = replace(unlocked, '/dashboard', 'c', 0)

      expect(paths(next)).toEqual(['/dashboard'])
      expect(cardKeys(next)).toEqual(['c'])
      expect(next[0]!.replaceAnimation).toBe('push')
    })
  })

  describe('navigating to a screen that is already in the stack', () => {
    it('reveals it and drops the screens above it, instead of stacking a second copy', () => {
      const deep = push(push(dashboard, '/explore', 'b', 1), '/dapp-web-view', 'c', 2)
      const next = push(deep, '/explore', 'd', 3)

      expect(paths(next)).toEqual(['/dashboard', '/explore'])
      // The apps catalog keeps its scroll position and its search.
      expect(cardKeys(next)).toEqual(['a', 'b'])
    })

    it('keeps the location object the revealed card was rendered with', () => {
      const deep = push(dashboard, '/explore', 'b', 1)
      const next = push(deep, '/dashboard', 'c', 2, { prevRoute: loc('/explore', 'b') })

      // Everything the screen derives from its location keeps its identity, so
      // revealing the card costs no render.
      expect(next[0]!.location).toBe(dashboard[0]!.location)
      // The card still follows the history entry it is revealed at.
      expect(next[0]!.key).toBe('c')
      expect(next[0]!.index).toBe(2)
    })

    it('takes the new location when the revealed card is asked to show something else', () => {
      const withParams: StackState = [
        {
          ...entry('/token-details', 'a', 0),
          location: { ...loc('/token-details', 'a'), search: '?address=0x1' }
        }
      ]
      const deep = push(withParams, '/explore', 'b', 1)
      const next = push(deep, '/token-details', 'c', 2)

      expect(next[0]!.location).not.toBe(withParams[0]!.location)
      expect(next[0]!.location.search).toBe('')
    })

    it('reveals it on a replace too, so the screen it leaves does not linger', () => {
      const browsing = push(push(dashboard, '/explore', 'b', 1), '/dapp-web-view', 'c', 2)
      const next = replace(browsing, '/explore', 'd', 2)

      expect(paths(next)).toEqual(['/dashboard', '/explore'])
      expect(cardKeys(next)).toEqual(['a', 'b'])
    })

    it('stacks a second copy when the navigation declares itself a step forward', () => {
      // The account personalize screen opens the account picker it came from, to
      // add more accounts: a step forward onto a screen the stack already has.
      const imported = push([entry('/account-picker', 'a', 0)], '/account-personalize', 'b', 1)
      const next = push(imported, '/account-picker', 'c', 2, { navDirection: 'forward' })

      expect(paths(next)).toEqual(['/account-picker', '/account-personalize', '/account-picker'])
      expect(cardKeys(next)).toEqual(['a', 'b', 'c'])

      // Completing it reveals the screen that opened it, rather than stacking a
      // second personalize screen on top.
      const completed = push(next, '/account-personalize', 'd', 3)

      expect(paths(completed)).toEqual(['/account-picker', '/account-personalize'])
      expect(cardKeys(completed)).toEqual(['a', 'b'])
    })

    it('stacks a new screen when that route is not in the stack', () => {
      const next = push(push(dashboard, '/explore', 'b', 1), '/receive', 'c', 2)

      expect(paths(next)).toEqual(['/dashboard', '/explore', '/receive'])
    })

    it('takes the history range of the screen it reveals, so a later back lands right', () => {
      const deep = push(push(dashboard, '/explore', 'b', 1), '/dapp-web-view', 'c', 2)
      const next = push(deep, '/dashboard', 'd', 3)

      expect(next[0]!.firstIndex).toBe(0)
      expect(next[0]!.index).toBe(3)
    })
  })

  describe('the direction a screen taking the place of another is animated in', () => {
    it("is forward for the app's own navigations", () => {
      const next = replace(dashboard, '/receive', 'b', 0)

      expect(next[0]!.replaceAnimation).toBe('push')
    })

    it('is backwards when the wallet locks', () => {
      const deep = push(dashboard, '/transfer', 'b', 1)
      const next = push(deep, '/unlock', 'c', 2)

      expect(paths(next)).toEqual(['/unlock'])
      expect(next[0]!.replaceAnimation).toBe('pop')
    })

    it('is backwards when the last account goes away', () => {
      const next = push(dashboard, '/get-started', 'b', 1)

      expect(next[0]!.replaceAnimation).toBe('pop')
    })

    it('is backwards for an onboarding "back" push', () => {
      const onboarding = push([entry('/get-started', 'a', 0)], '/import-private-key', 'b', 1)
      const next = push(onboarding, '/import-existing-account', 'c', 2, { navDirection: 'back' })

      expect(paths(next)).toEqual(['/get-started', '/import-existing-account'])
      expect(next[1]!.replaceAnimation).toBe('pop')
    })

    it('is backwards when a pop has to resync the stack', () => {
      const next = pop([entry('/dashboard', 'a', 4)], '/transfer', 'x', 3)

      expect(next[0]!.replaceAnimation).toBe('pop')
    })
  })
})
