import isEqual from 'react-fast-compare'

import { isDev } from '@common/config/env'
import { isExtension } from '@web/constants/browserapi'

import { ControllerHelpersStore } from './controllerHelpersStore'
import { ControllerStore } from './controllerStore'

type Listener = () => void
type Unsubscribe = () => void

/**
 * SubscriptionManager is a singleton that manages subscriptions to the ControllerStore.
 * It is used to optimize performance by:
 * 1. Aggregating subscriptions: It creates only one listener per controller ID in the store,
 *    regardless of how many components use the `useController` hook for that controller.
 * 2. Smart updates: It uses `react-fast-compare` to check for deep equality, preventing
 *    re-renders when the state reference changes but the content remains the same. A store
 *    that reconciles its snapshots answers that question with the reference alone, so there
 *    the comparison is skipped
 * 3. Selector support: It allows components to subscribe to specific slices of state via selectors,
 *    triggering updates only when that specific slice changes.
 */
export class SubscriptionManager {
  #stores: Map<
    any,
    Map<
      string,
      {
        listeners: Set<{ listener: Listener; selector?: (state: any) => any; lastValue: any }>
        unsub: Unsubscribe
      }
    >
  > = new Map()

  // Optional hook fired whenever the set of controller ids with at least one
  // active subscriber changes (a controller gains its first subscriber or loses
  // its last). Mobile uses this to tell the controller host which controller
  // states are worth serializing across the bridge. Unset on web/extension,
  // where it is a no-op and behavior is unchanged.
  #onSubscribedControllersChange?: (ids: string[]) => void

  setOnSubscribedControllersChange(cb: ((ids: string[]) => void) | undefined) {
    this.#onSubscribedControllersChange = cb
  }

  #notifySubscribedControllersChange(store: ControllerStore | ControllerHelpersStore) {
    if (!this.#onSubscribedControllersChange) return
    const storeSubs = this.#stores.get(store)
    this.#onSubscribedControllersChange(storeSubs ? Array.from(storeSubs.keys()) : [])
  }

  subscribe(
    id: string,
    listener: Listener,
    store: ControllerStore | ControllerHelpersStore,
    selector?: (state: any) => any
  ): Unsubscribe {
    if (!this.#stores.has(store)) {
      this.#stores.set(store, new Map())
    }
    const storeSubs = this.#stores.get(store)!

    if (!storeSubs.has(id)) {
      const unsub = store.subscribe(id, () => this.onStoreUpdate(id, store))
      storeSubs.set(id, { listeners: new Set(), unsub })
      this.#notifySubscribedControllersChange(store)
    }

    const subState = storeSubs.get(id)!
    const currentSnapshot = store.getSnapshot(id as any)
    const initialValue = selector ? selector(currentSnapshot) : currentSnapshot
    const listenerEntry = { listener, selector, lastValue: initialValue }

    subState.listeners.add(listenerEntry)

    return () => {
      subState.listeners.delete(listenerEntry)
      if (subState.listeners.size === 0) {
        subState.unsub()
        storeSubs.delete(id)
        if (storeSubs.size === 0) {
          this.#stores.delete(store)
        }
        this.#notifySubscribedControllersChange(store)
      }
    }
  }

  private onStoreUpdate(id: string, store: ControllerStore | ControllerHelpersStore) {
    const storeSubs = this.#stores.get(store)
    if (!storeSubs) return

    const subState = storeSubs.get(id)
    if (!subState) return

    const newState = store.getSnapshot(id as any)

    subState.listeners.forEach((entry) => {
      const { listener, selector, lastValue } = entry
      const newValue = selector ? selector(newState) : newState

      // Shallow check for performance
      if (newValue === lastValue) return

      if (!isExtension) {
        if (isDev && selector) this.#warnOnAllocatingSelector(id, newValue, lastValue)

        entry.lastValue = newValue
        listener()
        return
      }

      // Deep equality check using react-fast-compare
      if (!isEqual(newValue, lastValue)) {
        entry.lastValue = newValue
        listener()
      } else {
        // Update the reference even if they are deeply equal to optimize future shallow checks
        entry.lastValue = newValue
      }
    })
  }

  /**
   * Catches a selector that builds its result instead of reading it off the state.
   * Such a selector returns a new reference on every emit, so with the deep
   * comparison gone it re-renders its component even when nothing it reads changed.
   */
  #warnOnAllocatingSelector(id: string, newValue: unknown, lastValue: unknown) {
    if (!isEqual(newValue, lastValue)) return

    console.warn(
      `The selector for ${id} builds a new value on every update instead of returning one that lives on the state, so its component re-renders even when nothing changed. Return the state's own value, or move the derivation into the component.`
    )
  }

  getSnapshot(
    id: string,
    store: ControllerStore | ControllerHelpersStore,
    selector?: (state: any) => any
  ) {
    const state = store.getSnapshot(id as any)
    return selector ? selector(state) : state
  }
}
