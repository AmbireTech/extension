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
 * The direction a card is animated in when it takes the place of the one that was
 * on top. Only used for that case: a card the stack grows onto is always pushed,
 * and a card that a pop reveals is always popped, because the platform derives
 * those from the cards themselves.
 */
export type StackReplaceAnimation = 'push' | 'pop'

/** One screen in the stack - the routes matching `location`, kept mounted. */
export type StackEntry = {
  /**
   * Identity of the screen, for React and for the native stack. Stays the same
   * while the same screen is on top, so a navigation that only changes the search
   * params updates it instead of remounting - and the native stack does not
   * mistake it for a different screen and animate.
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
 * The direction a navigation declares, for the cases the history action cannot
 * tell: a flow that goes back by pushing rather than by popping (the onboarding
 * steps, the buttons that send the user home), or one that steps forward onto a
 * screen it already has a card for. See `BACK_NAVIGATION_STATE` /
 * `FORWARD_NAVIGATION_STATE`.
 */
const declaredDirection = (location: Location) =>
  (location.state as { navDirection?: 'back' | 'forward' } | null)?.navDirection

const isBackwardsPush = (location: Location) =>
  declaredDirection(location) === BACK_NAVIGATION_STATE.navDirection

/**
 * Which way a screen that replaces the one on top is animated. Forward is the
 * default - the app's automatic navigations move the user on (unlocking lands on
 * the dashboard). Going backwards has to be said explicitly: the flow marked its
 * push as a back step, or the destination is one the app sends the user to when
 * it takes them out of the wallet.
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
 * Whether two locations put the same thing on screen. Compared instead of taken
 * apart, because a card that is revealed keeps rendering the location object it
 * was rendered with when they do - and everything the screen derives from that
 * object keeps its identity, so revealing the card costs no render at all. A new
 * object equal to the old one would instead re-run the route matching and every
 * memo below it, in the commit that starts the transition back to the card.
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
 * Derives the card stack from the router's memory history. Pure, so the
 * direction rules can be reasoned about (and tested) on their own. Returns the
 * stack it was given when the navigation changes no screen, so the caller can
 * tell a no-op apart by identity.
 */
const reduceStack = (entries: StackState, event: NavigationEvent): StackState => {
  const top = entries[entries.length - 1]

  // The redirect hub is passed through rather than shown: the card on top keeps
  // its screen and only follows the history position, so the redirect that comes
  // next is a single transition from the screen the user was on - and no blank
  // card is put up in between. On boot there is no card yet, and the first real
  // route becomes the first one, which the platform shows without animating.
  if (event.location.pathname === REDIRECT_HUB_PATH) {
    if (!top) return entries

    return [...entries.slice(0, -1), { ...top, key: event.location.key, index: event.index }]
  }

  const entry = toEntry(event)

  // Navigating to the screen that is already on top is not a new card: it is the
  // same screen with different search params (the dashboard writes its session id
  // and its open tab that way), or a redundant redirect. Keeping the card's
  // identity is what stops the screen from remounting - and remounting a screen
  // that navigates on mount is an endless loop.
  if (top && top.location.pathname === entry.location.pathname)
    return [...entries.slice(0, -1), { ...entry, cardKey: top.cardKey, firstIndex: top.firstIndex }]

  if (event.navigationType === 'POP') {
    // The card that owns the history index being popped to. Compared against the
    // range a card covers, so popping an in-place update lands on the card that
    // pushed it rather than looking like a stranger.
    const ownerIndex = entries.findLastIndex((e) => e.firstIndex <= event.index)
    const owner = entries[ownerIndex]

    // The stack drifted from the history (it was collapsed by a reset, or the
    // app deep linked into it), so there is nothing to reveal - resync to the
    // single entry the history points at, still animated as the back step it is.
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

  // Navigating to a screen that is already in the stack goes back to it instead of
  // stacking a second copy of it - the same thing react-navigation's `navigate`
  // does. The screen is revealed with its state, the screens above it are dropped,
  // and the platform sees a real pop. This is what makes the buttons that send the
  // user home (they navigate rather than pop) and a flow returning to an earlier
  // step read as back transitions, with nothing to declare at the call site. A flow
  // that means to go deeper into a screen it has already been on says so, the way
  // react-navigation's `push` is the counterpart of its `navigate`.
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

  // A flow that goes back to a step it has no card for - the onboarding steps can
  // skip screens - swaps the screen on top for it instead of stacking it on. When
  // the step does have a card, it was revealed above.
  if (isBackwardsPush(event.location) && top) return [...entries.slice(0, -1), entry]

  // Landing on a root path collapses the stack, so a swipe back can never reveal a
  // screen from before a lock or before onboarding. Only reached when that screen
  // is not in the stack already - when it is, it was revealed above.
  if (MOBILE_ROOT_ROUTE_PATHS.includes(event.location.pathname)) return [entry]

  if (event.navigationType === 'REPLACE') return [...entries.slice(0, -1), entry]

  return [...entries, entry]
}

export { reduceStack }
