import isEqual from 'react-fast-compare'
import type { Location } from 'react-router-native'

import {
  BACK_NAVIGATION_STATE,
  FORWARD_NAVIGATION_STATE,
  MOBILE_BACKWARDS_ROUTE_PATHS,
  MOBILE_ROOT_ROUTE_PATHS
} from '@common/modules/router/constants/common'

/** The history action behind a location change, as `useNavigationType` reports it. */
export type StackNavigationType = 'PUSH' | 'POP' | 'REPLACE'

/**
 * The direction a card is animated in when it takes the place of the one on top. Only
 * for that case: the platform derives the rest from the cards themselves.
 */
export type StackReplaceAnimation = 'push' | 'pop'

/** One screen in the stack - the routes matching `location`, kept mounted. */
export type StackEntry = {
  /**
   * Identity of the screen, for React and for the native stack. Stays the same while
   * the same screen is on top, so a navigation that only changes the search params
   * neither remounts it nor looks to the platform like a different screen.
   */
  cardKey: string
  /** Location key of the entry this card currently shows. */
  key: string
  location: Location
  /** The memory history index this card currently shows. */
  index: number
  /**
   * The first history index this card was created at. A card owns a range of them,
   * because an in-place update pushes a history entry without adding a card.
   */
  firstIndex: number
  replaceAnimation: StackReplaceAnimation
}

/** The screens the native stack renders, ordered bottom to top. */
export type StackState = StackEntry[]

export type NavigationEvent = {
  location: Location
  index: number
  navigationType: StackNavigationType
}

/**
 * Not a screen but the router's redirect hub: no route matches it, and the
 * controllers send the view on from it as soon as they resolve where it belongs.
 */
const REDIRECT_HUB_PATH = '/'

/**
 * The direction a navigation declares, where the history action cannot tell: a flow
 * that goes back by pushing rather than popping, or one that steps forward onto a
 * screen it already has a card for. See `BACK_NAVIGATION_STATE` /
 * `FORWARD_NAVIGATION_STATE`.
 */
const declaredDirection = (location: Location) =>
  (location.state as { navDirection?: 'back' | 'forward' } | null)?.navDirection

const isBackwardsPush = (location: Location) =>
  declaredDirection(location) === BACK_NAVIGATION_STATE.navDirection

/**
 * Which way a screen that replaces the one on top is animated. Forward by default,
 * since the app's automatic navigations move the user on. Backwards has to be said:
 * the push declared itself a back step, or the destination is one the app falls back
 * to when it takes the user out of the wallet.
 */
const resolveReplaceAnimation = (location: Location): StackReplaceAnimation =>
  isBackwardsPush(location) || MOBILE_BACKWARDS_ROUTE_PATHS.includes(location.pathname)
    ? 'pop'
    : 'push'

/**
 * The keys `useNavigation` adds to every navigation for its own bookkeeping. They
 * say where the user came from, not what the screen shows.
 */
const ROUTER_OWNED_STATE_KEYS = ['prevRoute', 'navDirection']

const screenInputOf = (location: Location) => {
  const state = location.state as Record<string, unknown> | null

  if (!state) return null

  const screenInput = Object.entries(state).filter(
    ([key]) => !ROUTER_OWNED_STATE_KEYS.includes(key)
  )

  return screenInput.length ? Object.fromEntries(screenInput) : null
}

/**
 * Whether two locations put the same thing on screen. A revealed card then keeps the
 * location object it was rendered with, so everything derived from it keeps its
 * identity and revealing the card costs no render. An equal but new object would
 * re-run the route matching and every memo below it instead.
 */
const showsTheSameScreen = (one: Location, other: Location) =>
  one.pathname === other.pathname &&
  one.search === other.search &&
  isEqual(screenInputOf(one), screenInputOf(other))

const revealedLocation = (revealed: StackEntry, location: Location) =>
  showsTheSameScreen(revealed.location, location) ? revealed.location : location

const toEntry = ({ location, index }: NavigationEvent): StackEntry => ({
  cardKey: location.key,
  key: location.key,
  location,
  index,
  firstIndex: index,
  replaceAnimation: resolveReplaceAnimation(location)
})

/**
 * Derives the card stack from the router's memory history. Pure, so the direction
 * rules can be tested on their own. Returns the stack it was given when a navigation
 * changes no screen, so a no-op is told apart by identity.
 */
const reduceStack = (entries: StackState, event: NavigationEvent): StackState => {
  const top = entries[entries.length - 1]

  // The hub is passed through rather than shown: the top card keeps its screen and only
  // follows the history, so the redirect is one transition with no blank card between.
  if (event.location.pathname === REDIRECT_HUB_PATH) {
    if (!top) return entries

    return [...entries.slice(0, -1), { ...top, key: event.location.key, index: event.index }]
  }

  const entry = toEntry(event)

  // Navigating to the screen already on top is the same screen with different search
  // params, or a redundant redirect. Keeping the card's identity is what stops a
  // remount - and remounting a screen that navigates on mount never ends.
  if (top && top.location.pathname === entry.location.pathname)
    return [...entries.slice(0, -1), { ...entry, cardKey: top.cardKey, firstIndex: top.firstIndex }]

  if (event.navigationType === 'POP') {
    // The card owning the index popped to, matched against the range a card covers, so
    // popping an in-place update lands on the card that pushed it.
    const ownerIndex = entries.findLastIndex((e) => e.firstIndex <= event.index)
    const owner = entries[ownerIndex]

    // The stack drifted from the history - collapsed by a reset, or deep linked into -
    // so resync to the entry it points at, still animated as the back step it is.
    if (!owner) return [{ ...entry, replaceAnimation: 'pop' }]

    return [
      ...entries.slice(0, ownerIndex),
      {
        ...entry,
        cardKey: owner.cardKey,
        firstIndex: owner.firstIndex,
        location: revealedLocation(owner, entry.location)
      }
    ]
  }

  // Navigating to a screen already in the stack reveals it with its state and drops
  // the screens above, so the platform sees a real pop - which is what makes the
  // buttons that send the user home read as back transitions with nothing declared at
  // the call site. Going deeper into such a screen has to say so, as with
  // react-navigation's `push` against its `navigate`.
  const revealedIndex =
    declaredDirection(event.location) === FORWARD_NAVIGATION_STATE.navDirection
      ? -1
      : entries.findLastIndex((e) => e.location.pathname === entry.location.pathname)

  if (revealedIndex >= 0) {
    const revealed = entries[revealedIndex]!

    return [
      ...entries.slice(0, revealedIndex),
      {
        ...entry,
        cardKey: revealed.cardKey,
        firstIndex: revealed.firstIndex,
        location: revealedLocation(revealed, entry.location)
      }
    ]
  }

  // A back step with no card of its own - flows can skip screens - swaps the screen on
  // top for it. When it does have a card, it was revealed above.
  if (isBackwardsPush(event.location) && top) return [...entries.slice(0, -1), entry]

  // A root path collapses the stack, so a swipe back can never reveal a screen from
  // before a lock or before onboarding.
  if (MOBILE_ROOT_ROUTE_PATHS.includes(event.location.pathname)) return [entry]

  if (event.navigationType === 'REPLACE') return [...entries.slice(0, -1), entry]

  return [...entries, entry]
}

export { reduceStack }
