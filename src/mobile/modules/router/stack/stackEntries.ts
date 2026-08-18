import type { Location } from 'react-router-native'

import { MOBILE_ROOT_ROUTE_PATHS } from '@common/modules/router/constants/common'

/** The history action behind a location change, as `useNavigationType` reports it. */
export type StackNavigationType = 'PUSH' | 'POP' | 'REPLACE'

/** One card in the stack - the screens matching `location`, kept mounted. */
export type StackEntry = {
  /**
   * Identity of the card, for React and for its animated offset. Stays the same
   * while the same screen is on top, so a navigation that only changes the search
   * params updates the card instead of remounting the screen inside it.
   */
  cardKey: string
  /** Location key of the entry this card currently shows. */
  key: string
  location: Location
  /** The memory history index this card currently shows. */
  index: number
  /**
   * The first history index this card was created at. A card can own a range of
   * them, because an in-place update (new search params on the same screen)
   * pushes a history entry without adding a card.
   */
  firstIndex: number
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
  cardKey: location.key,
  key: location.key,
  location,
  index,
  firstIndex: index
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

  // Navigating to the screen that is already on top is not a new card: it is the
  // same screen with different search params (the dashboard writes its session id
  // and its open tab that way), or a redundant redirect. Keeping the card's
  // identity is what stops the screen from remounting - and remounting a screen
  // that navigates on mount is an endless loop.
  if (top && top.location.pathname === entry.location.pathname)
    return {
      ...state,
      entries: [
        ...state.entries.slice(0, -1),
        { ...entry, cardKey: top.cardKey, firstIndex: top.firstIndex }
      ],
      settledKey: undefined
    }

  if (event.navigationType === 'POP') {
    // The card that owns the history index being popped to. Compared against the
    // range a card covers, so popping an in-place update lands on the card that
    // pushed it rather than looking like a stranger.
    const ownerIndex = state.entries.findLastIndex((e) => e.firstIndex <= event.index)
    const owner = state.entries[ownerIndex]

    // The stack drifted from the history (it was collapsed by a reset, or the
    // app deep linked into it), so there is nothing to reveal - resync to the
    // single entry the history points at.
    if (!owner) return { entries: [entry], closing: [], settledKey: entry.cardKey }

    return {
      entries: [
        ...state.entries.slice(0, ownerIndex),
        { ...entry, cardKey: owner.cardKey, firstIndex: owner.firstIndex }
      ],
      closing: top && top.cardKey !== owner.cardKey ? [...state.closing, top] : state.closing,
      settledKey: owner.cardKey
    }
  }

  if (isBackwardsPush(event.location) && top) {
    const below = state.entries[state.entries.length - 2]
    // The pushed route is the one already sitting below the top, so that card
    // is swapped for the new entry instead of being duplicated behind it.
    const isReturningToTheCardBelow = below?.location.pathname === entry.location.pathname

    return {
      entries: [...state.entries.slice(0, isReturningToTheCardBelow ? -2 : -1), entry],
      closing: [...state.closing, top],
      settledKey: entry.cardKey
    }
  }

  // Landing on a root path collapses the stack, so a swipe back can never reveal
  // a screen from before a lock or before onboarding. Checked after the backwards
  // cases, so that popping to a root path still animates as a back transition.
  if (MOBILE_ROOT_ROUTE_PATHS.includes(event.location.pathname)) {
    // Screens that send the user home navigate to the dashboard rather than pop
    // (see the transfer and account-select back buttons). The card already showing
    // that screen is reused, so going home reveals it - with its state - instead of
    // rebuilding it, and the screen being left behind animates away.
    const revealed = state.entries.find(
      (e) => e.cardKey !== top?.cardKey && e.location.pathname === entry.location.pathname
    )

    if (revealed && top)
      return {
        entries: [{ ...entry, cardKey: revealed.cardKey, firstIndex: revealed.firstIndex }],
        closing: [...state.closing, top],
        settledKey: revealed.cardKey
      }

    return { entries: [entry], closing: [], settledKey: entry.cardKey }
  }

  if (event.navigationType === 'REPLACE')
    return { ...state, entries: [...state.entries.slice(0, -1), entry], settledKey: undefined }

  return { ...state, entries: [...state.entries, entry], settledKey: undefined }
}

export { reduceStack }
