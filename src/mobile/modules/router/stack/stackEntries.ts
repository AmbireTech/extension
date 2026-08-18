import type { Location } from 'react-router-native'

import { MOBILE_ROOT_ROUTE_PATHS } from '@common/modules/router/constants/common'

/** The history action behind a location change, as `useNavigationType` reports it. */
export type StackNavigationType = 'PUSH' | 'POP' | 'REPLACE'

/** One card in the stack - the screens matching `location`, kept mounted. */
export type StackEntry = {
  key: string
  location: Location
  /** The memory history index this entry was created at. */
  index: number
}

export type StackState = {
  /** Live cards, ordered bottom to top. */
  entries: StackEntry[]
  /** Cards that were popped and are still on screen, animating out above `entries`. */
  closing: StackEntry[]
  /**
   * A card that is entering the stack already in place, because it is the one a
   * back transition reveals rather than a new screen sliding in.
   */
  settledKey?: string
}

export type NavigationEvent = {
  location: Location
  index: number
  navigationType: StackNavigationType
}

const toEntry = ({ location, index }: NavigationEvent): StackEntry => ({
  key: location.key,
  location,
  index
})

/**
 * The onboarding flow navigates backwards by pushing the previous route (see
 * `onboardingNavigationContext`), so the history action alone cannot tell the
 * direction. That flow marks its own navigations instead.
 */
const isBackwardsPush = (location: Location) =>
  (location.state as { navDirection?: 'back' } | null)?.navDirection === 'back'

/**
 * Derives the card stack from the router's memory history. Pure, so the
 * direction rules can be reasoned about (and tested) on their own.
 */
const reduceStack = (state: StackState, event: NavigationEvent): StackState => {
  const entry = toEntry(event)
  const top = state.entries[state.entries.length - 1]

  if (event.navigationType === 'POP') {
    const remaining = state.entries.filter((e) => e.index <= event.index)
    const newTop = remaining[remaining.length - 1]

    // The stack drifted from the history (it was collapsed by a reset, or the
    // app deep linked into it), so there is nothing to reveal - resync to the
    // single entry the history points at.
    if (!newTop || newTop.key !== entry.key)
      return { entries: [entry], closing: [], settledKey: entry.key }

    return { entries: remaining, closing: top && top.key !== newTop.key ? [top] : [] }
  }

  if (isBackwardsPush(event.location) && top) {
    const below = state.entries[state.entries.length - 2]
    // The pushed route is the one already sitting below the top, so that card
    // is swapped for the new entry instead of being duplicated behind it.
    const isReturningToTheCardBelow = below?.location.pathname === entry.location.pathname

    return {
      entries: [...state.entries.slice(0, isReturningToTheCardBelow ? -2 : -1), entry],
      closing: [top],
      settledKey: entry.key
    }
  }

  // Landing on a root path collapses the stack, so a swipe back can never reveal
  // a screen from before a lock or before onboarding. Checked after the backwards
  // cases, so that popping to a root path still animates as a back transition.
  if (MOBILE_ROOT_ROUTE_PATHS.includes(event.location.pathname)) {
    // Screens that send the user home navigate to the dashboard rather than pop
    // (see the swap and account-select back buttons). That is still a way back to
    // a card the stack already has, so it animates like one.
    const isReturningToACardBelow =
      !!top &&
      state.entries.some(
        (e) => e.key !== top.key && e.location.pathname === entry.location.pathname
      )

    return {
      entries: [entry],
      closing: isReturningToACardBelow ? [top] : [],
      settledKey: entry.key
    }
  }

  if (event.navigationType === 'REPLACE')
    return { ...state, entries: [...state.entries.slice(0, -1), entry], settledKey: undefined }

  return { ...state, entries: [...state.entries, entry], settledKey: undefined }
}

export { reduceStack }
