import isEqual from 'react-fast-compare'

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
 *    re-renders when the state reference changes but the content remains the same.
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

      // Deep equality check using react-fast-compare
      if (!isEqual(newValue, lastValue)) {
        entry.lastValue = newValue
        listener()
      }
    })
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
