import { flushSync } from 'react-dom'

import { parse, stringify } from '@ambire-common/libs/richJson/richJson'
import { AllControllersMappingType } from '@common/constants/controllersMapping'
import { isExtension } from '@web/constants/browserapi'

export class ControllerStore {
  #states: Partial<AllControllersMappingType> = {}

  #listeners: Map<string, Set<() => void>> = new Map()

  #controllersByName: (keyof AllControllersMappingType)[] = []

  #onReady: () => void

  static readonly #EMPTY_STATE = Object.freeze({})

  constructor({ onReady }: { onReady: () => void }) {
    this.#onReady = onReady
  }

  // Track which controllers have received their first update
  initializedControllers: Set<keyof AllControllersMappingType> = new Set()

  init(
    allControllersByName: (keyof AllControllersMappingType)[],
    onInitReady: (allControllersByName: (keyof AllControllersMappingType)[]) => void
  ) {
    this.#controllersByName = allControllersByName
    onInitReady(allControllersByName)
    this.#checkReadiness()
  }

  update<K extends keyof AllControllersMappingType>(
    id: K,
    ctrl: AllControllersMappingType[K],
    forceEmit?: boolean
  ) {
    if (ctrl === undefined) return
    try {
      this.#states[id] = isExtension ? { ...ctrl } : parse(stringify(ctrl))
    } catch (error) {
      console.error(error)
    }
    if (
      !this.initializedControllers.has(id) ||
      (!('isReady' in (this.#states?.[id] || {})) && !(this.#states?.[id] as any).isReady)
    ) {
      this.initializedControllers.add(id)
      this.#checkReadiness()
    }

    const idListeners = this.#listeners.get(id as string)
    if (!idListeners) return

    if (forceEmit) {
      /**
       * For certain updates, we need to override React's default behavior of batching state updates and render the update immediately.
       * This is particularly handy when multiple status flags are being updated rapidly.
       * Without the forceEmit option, React will only render the very first and last status updates, batching the ones in between.
       *
       * Here's more info about `flushSync`:
       * Introduced in React 18, flushSync is a function that forces React to re-render synchronously within its callback,
       * before continuing with the rest of the JavaScript event loop.
       * This goes against React's default behavior of batching state updates for optimized performance.
       */
      flushSync(() => {
        idListeners.forEach((callback) => callback())
      })
    } else {
      idListeners.forEach((callback) => callback())
    }
  }

  subscribe(id: string, listener: () => void) {
    if (!this.#listeners.has(id)) this.#listeners.set(id, new Set())
    this.#listeners.get(id)!.add(listener)
    return () => this.#listeners.get(id)?.delete(listener)
  }

  getSnapshot<K extends keyof AllControllersMappingType>(id: K): AllControllersMappingType[K] {
    return this.#states[id] || (ControllerStore.#EMPTY_STATE as AllControllersMappingType[K])
  }

  #checkReadiness() {
    if (!this.#controllersByName.length) return
    // Check if every required controller exists in the initialized set
    const allReady = Array.from(this.#controllersByName).every((ctrlName) => {
      if (!this.initializedControllers.has(ctrlName)) return false

      if ('isReady' in (this.#states?.[ctrlName] || {})) {
        return (this.#states[ctrlName] as any).isReady === true
      }

      return true
    })

    if (allReady) !!this.#onReady && this.#onReady()
  }
}
