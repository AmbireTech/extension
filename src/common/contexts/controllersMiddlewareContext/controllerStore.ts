import { flushSync } from 'react-dom'

import { parse, stringify } from '@ambire-common/libs/richJson/richJson'
import { ControllersMappingType } from '@common/constants/controllersMapping'
import { isExtension } from '@web/constants/browserapi'

type ControllerId = keyof ControllersMappingType

export class ControllerStore {
  #states: Partial<ControllersMappingType> = {}
  #listeners: Map<string, Set<() => void>> = new Map()
  #controllersByName: ControllerId[] = []
  #onInit: () => ControllerId[]
  #onReady: () => void

  constructor({ onInit, onReady }: { onInit: () => ControllerId[]; onReady: () => void }) {
    this.#onInit = onInit
    this.#onReady = onReady
  }

  // Track which controllers have received their first update
  initializedControllers: Set<ControllerId> = new Set()

  init() {
    if (this.#controllersByName.length) return

    this.#controllersByName = this.#onInit()
    this.#checkReadiness()
  }
  update<K extends ControllerId>(id: K, ctrl: ControllersMappingType[K], forceEmit?: boolean) {
    this.#states[id] = isExtension ? { ...ctrl } : parse(stringify(ctrl))
    console.log(id, this.#states[id])
    if (!this.initializedControllers.has(id)) {
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

  getSnapshot<K extends ControllerId>(id: K): ControllersMappingType[K] {
    return this.#states[id] || ({} as ControllersMappingType[K])
  }

  #checkReadiness() {
    if (!this.#controllersByName.length) return
    // Check if every required controller exists in the initialized set
    const allReady = Array.from(this.#controllersByName).every((ctrlName) =>
      this.initializedControllers.has(ctrlName)
    )

    if (allReady) !!this.#onReady && this.#onReady()
  }
}
