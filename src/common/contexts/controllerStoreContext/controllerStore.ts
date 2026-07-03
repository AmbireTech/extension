import { flushSync } from 'react-dom'

import { parse, stringify } from '@ambire-common/libs/richJson/richJson'
import { isMobile } from '@common/config/env'
import { AllControllersMappingType } from '@common/constants/controllersMapping'
import { isExtension } from '@web/constants/browserapi'

export const CONTROLLER_STORE_MAX_LOADING_TIME = 10000

export class ControllerStore {
  isReady = false

  // Flips to true as soon as the subset of controllers required to decide the
  // initial route is initialized. Used on mobile to hide the splash screen
  // before heavier controllers (portfolio, dapps, activity, ...) have crossed
  // the webview bridge. On platforms that don't pass a critical subset to
  // `init`, this stays false and is unused.
  isReadyToLoadRoutes = false

  #states: Partial<AllControllersMappingType> = {}

  #listeners: Map<string, Set<(eventData?: any) => void>> = new Map()

  controllersByName: (keyof AllControllersMappingType)[] = []

  #criticalControllers: (keyof AllControllersMappingType)[] = []

  #onReady: () => void

  #onReadyToLoadRoutes?: () => void

  static readonly #EMPTY_STATE = Object.freeze({})

  constructor({
    onReady,
    onReadyToLoadRoutes
  }: {
    onReady: () => void
    onReadyToLoadRoutes?: () => void
  }) {
    this.#onReady = onReady
    this.#onReadyToLoadRoutes = onReadyToLoadRoutes

    setTimeout(() => {
      if (!this.isReady && this.#listeners.has('events')) {
        this.#listeners.get('events')!.forEach((cb) => cb('controllersLoadingTakingTooLong'))
      }
    }, CONTROLLER_STORE_MAX_LOADING_TIME)
  }

  // Track which controllers have received their first update
  initializedControllers: Set<keyof AllControllersMappingType> = new Set()

  init(
    allControllersByName: (keyof AllControllersMappingType)[],
    criticalControllers: (keyof AllControllersMappingType)[] = [],
    onInitReady?: (allControllersByName: (keyof AllControllersMappingType)[]) => void
  ) {
    this.controllersByName = allControllersByName
    this.#criticalControllers = criticalControllers
    onInitReady?.(allControllersByName)
    this.#checkReadiness()
    this.#checkRoutesReadiness()
  }

  update<K extends keyof AllControllersMappingType>(
    id: K,
    ctrl: AllControllersMappingType[K],
    forceEmit?: boolean
  ) {
    if (ctrl === undefined) return
    try {
      this.#states[id] = isExtension || isMobile ? { ...ctrl } : parse(stringify(ctrl))
    } catch (error) {
      console.error(error)
    }
    // Track first-emit. We re-check readiness on every update so a controller
    // whose `isReady` flips from `false` to `true` on a later emit can graduate
    // the store from "loading" to "ready" even if no other controller emits
    // afterwards. `#checkReadiness` / `#checkRoutesReadiness` are idempotent
    // and only fire their `onReady` callbacks once.
    if (!this.initializedControllers.has(id)) {
      this.initializedControllers.add(id)
    }
    this.#checkReadiness()
    this.#checkRoutesReadiness()

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

  getAllSnapshots(): Partial<AllControllersMappingType> {
    return this.#states
  }

  addEventsListener(listener: (eventData?: any) => void) {
    if (!this.#listeners.has('events')) this.#listeners.set('events', new Set())
    this.#listeners.get('events')!.add(listener)
    return () => this.#listeners.get('events')?.delete(listener)
  }

  #checkReadiness() {
    if (this.isReady) return
    if (!this.controllersByName.length) return
    // Check if every required controller exists in the initialized set
    const allReady = Array.from(this.controllersByName).every((ctrlName) => {
      if (!this.initializedControllers.has(ctrlName)) return false

      if ('isReady' in (this.#states?.[ctrlName] || {})) {
        return (this.#states[ctrlName] as any).isReady === true
      }

      return true
    })

    // NOTE: used for debugging the initial loading of controllers
    // console.log(
    //   'not ready controllers',
    //   this.controllersByName.filter((ctrlName) => !this.initializedControllers.has(ctrlName))
    // )

    if (allReady) {
      this.isReady = true
      if (this.#listeners.has('events')) {
        this.#listeners.get('events')!.forEach((cb) => cb('controllersReady'))
      }
      !!this.#onReady && this.#onReady()
    }
  }

  #checkRoutesReadiness() {
    if (this.isReadyToLoadRoutes) return
    if (!this.#criticalControllers.length) return

    const allReady = this.#criticalControllers.every((ctrlName) => {
      if (!this.initializedControllers.has(ctrlName)) return false

      if ('isReady' in (this.#states?.[ctrlName] || {})) {
        return (this.#states[ctrlName] as any).isReady === true
      }

      return true
    })

    if (allReady) {
      this.isReadyToLoadRoutes = true
      !!this.#onReadyToLoadRoutes && this.#onReadyToLoadRoutes()
    }
  }
}
