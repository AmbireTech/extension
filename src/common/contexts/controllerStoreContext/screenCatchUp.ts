/**
 * Screens the user is not on unsubscribe from the controllers, and a screen being
 * transitioned to subscribes back only once that transition has settled - so both keep
 * rendering the state they were left with in the meantime (see `useControllerState`).
 *
 * Some changes invalidate all of it at once. A switch of the selected account is the
 * whole of what every screen renders, so what they hold is the account the user has just
 * moved off - and the screen the switch takes them to would spend the transition showing
 * it. This is how they are told to re-read the state where they stand, without
 * subscribing them back to the traffic they were unsubscribed from.
 */
const listeners = new Set<() => void>()

/** Has every mounted screen read the controller state again, subscribed or not. */
export const catchUpScreens = () => {
  listeners.forEach((listener) => listener())
}

export const subscribeToScreenCatchUp = (listener: () => void) => {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}
