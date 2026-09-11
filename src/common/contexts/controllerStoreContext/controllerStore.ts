import { isDev } from '@common/config/env'
import eventBus from '@common/services/event/eventBus'
import { reconcileState } from '@common/utils/reconcileState'

import { createCtrlStateCommitter } from './ctrlStateCommitter'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

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

  /**
   * What puts a controller's state in front of React. Platform specific, because making
   * sure the UI sees every forced update takes a `flushSync` on the DOM and a paced
   * hand-over on React Native, which has none.
   */
  #committer = createCtrlStateCommitter((id, state) => this.#deliverState(id, state))

  controllersByName: (keyof AllControllersMappingType)[] = []

  #criticalControllers: (keyof AllControllersMappingType)[] = []

  /**
   * Controllers the platform deliberately loads after the initial route renders.
   * Waiting on them is expected, so they are left out of `isReady` and of the
   * `controllersLoadingTakingTooLong` check that reports a broken boot.
   */
  #deferredControllers: (keyof AllControllersMappingType)[] = []

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

    eventBus.addEventListener('ctrlUpdate', this.#onCtrlUpdate)

    setTimeout(() => {
      // Waiting on a deferred controller is expected and must not be reported as a
      // broken boot
      if (this.isReady || !this.#listeners.has('events')) return

      this.#listeners.get('events')!.forEach((cb) => cb('controllersLoadingTakingTooLong'))
    }, CONTROLLER_STORE_MAX_LOADING_TIME)
  }

  #onCtrlUpdate = ({
    ctrlName,
    ctrlState,
    forceEmit
  }: {
    ctrlName: string
    ctrlState: any
    forceEmit?: boolean
  }) => {
    try {
      this.update(ctrlName as any, ctrlState, forceEmit)
    } catch (e) {
      console.error(`controllerStore.update failed for controller "${ctrlName}":`, e)
    }
  }

  /** Stops the store from taking any further controller state. */
  destroy() {
    eventBus.removeEventListener('ctrlUpdate', this.#onCtrlUpdate)
    this.#committer.destroy()
  }

  // Track which controllers have received their first update
  initializedControllers: Set<keyof AllControllersMappingType> = new Set()

  init(
    allControllersByName: (keyof AllControllersMappingType)[],
    criticalControllers: (keyof AllControllersMappingType)[] = [],
    onInitReady?: (allControllersByName: (keyof AllControllersMappingType)[]) => void,
    deferredControllers: (keyof AllControllersMappingType)[] = []
  ) {
    this.controllersByName = allControllersByName
    this.#criticalControllers = criticalControllers
    this.#deferredControllers = deferredControllers
    onInitReady?.(allControllersByName)
    this.#checkReadiness()
    this.#checkRoutesReadiness()
  }

  // Narrows the set of controllers whose readiness gates `isReadyToLoadRoutes`.
  // Called once the background reports the initial route, so the splash can hide
  // as soon as only the controllers that route needs are ready.
  setCriticalControllers(criticalControllers: (keyof AllControllersMappingType)[]) {
    this.#criticalControllers = criticalControllers
    this.#checkRoutesReadiness()
  }

  update<K extends keyof AllControllersMappingType>(
    id: K,
    ctrl: AllControllersMappingType[K],
    forceEmit?: boolean
  ) {
    if (ctrl === undefined) return
    // The newest snapshot, which while a burst is being paced out is the last one the
    // committer holds - reconciling against the delivered one would drop what it still
    // has queued.
    const prevState = this.#newestStateOf(id)
    let nextState = prevState
    try {
      // Reconciling keeps the emit path cheap: the snapshot is detached from the
      // controller's own objects, which is mandatory where the controllers run in this
      // same realm, and every object the update did not touch keeps the identity it
      // already had. So an emit that changed nothing returns the previous snapshot
      // untouched and every subscriber exits on a reference check. The extension's
      // state already arrives detached over the port, but it arrives as a fresh tree on
      // every emit, which is what used to make each of its subscribers deep compare its
      // own slice - and hand every memoized child new props for unchanged content.
      nextState = reconcileState(prevState, ctrl, {
        label: id as string,
        detectCycles: isDev
      })
    } catch (error) {
      // Leaving the snapshot unset means every consumer reads the empty state and
      // the store never reports ready, so the controller has to be named or the
      // failure looks like an unrelated crash in whichever screen read it first.
      console.error(`controllerStore: could not snapshot the state of ${id}:`, error)
    }
    // Track first-emit. We re-check readiness on every update so a controller
    // whose `isReady` flips from `false` to `true` on a later emit can graduate
    // the store from "loading" to "ready" even if no other controller emits
    // afterwards. `#checkReadiness` / `#checkRoutesReadiness` are idempotent
    // and only fire their `onReady` callbacks once.
    if (!this.initializedControllers.has(id)) {
      this.initializedControllers.add(id)
    }
    // An emit the reconcile found no change in leaves every subscriber's value at the
    // very reference it already holds, so notifying them could only end in a no-op - and
    // the newest snapshot is either the delivered one or one queued ahead of this emit,
    // which keeps its place. `forceEmit` is let through: it is the path a user action is
    // waiting on.
    if (nextState !== prevState || forceEmit)
      this.#committer.commit(id as string, nextState, forceEmit)

    this.#checkReadiness()
    this.#checkRoutesReadiness()
  }

  /** Exposes a snapshot and notifies the controller's subscribers of it. */
  #deliverState(id: string, state: any) {
    this.#states[id as keyof AllControllersMappingType] = state

    const idListeners = this.#listeners.get(id)
    if (!idListeners) return false

    idListeners.forEach((callback) => callback())

    return true
  }

  #newestStateOf<K extends keyof AllControllersMappingType>(id: K) {
    return this.#committer.pendingStateOf(id as string) ?? this.#states[id]
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

  // A controller counts as ready once it has sent a first state and, when that state
  // carries an `isReady` flag, once the flag is true.
  #isControllerReady(ctrlName: keyof AllControllersMappingType) {
    if (!this.initializedControllers.has(ctrlName)) return false

    const newestState = this.#newestStateOf(ctrlName)

    if ('isReady' in (newestState || {})) {
      return (newestState as any).isReady === true
    }

    return true
  }

  /**
   * Whether every one of the given controllers has sent a first state and, when that
   * state carries an `isReady` flag, has it set to true. Lets a caller wait on its own
   * subset of controllers instead of on the whole store.
   */
  areControllersReady(ctrlNames: (keyof AllControllersMappingType)[]) {
    return ctrlNames.every((ctrlName) => this.#isControllerReady(ctrlName))
  }

  #checkReadiness() {
    if (this.isReady) return
    if (!this.controllersByName.length) return
    // Check if every required controller exists in the initialized set, leaving out the
    // ones the platform deliberately loads after the first paint.
    const allReady = this.controllersByName.every(
      (ctrlName) =>
        this.#deferredControllers.includes(ctrlName) || this.#isControllerReady(ctrlName)
    )

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

    const allReady = this.#criticalControllers.every((ctrlName) =>
      this.#isControllerReady(ctrlName)
    )

    if (allReady) {
      this.isReadyToLoadRoutes = true
      !!this.#onReadyToLoadRoutes && this.#onReadyToLoadRoutes()
    }
  }
}
