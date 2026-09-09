import { flushSync } from 'react-dom'

import { Dapp } from '@ambire-common/interfaces/dapp'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

interface DappsControllerHelpers {
  isLoadingCurrentDapp: boolean
  currentDapp: Dapp | null
  getCurrentDapp: () => Promise<Dapp | null>
  dappUrl?: string
  setDappUrl?: (url: string) => void
  hasUnverifiedDapps: (dapps: string[]) => Promise<boolean>
}

interface RequestsControllerHelpers {
  requestModalRef: React.RefObject<any> | null
  openRequestModal: (() => void) | null
  closeRequestModal: (() => void) | null
  onBottomSheetClosed: (() => void) | null
  onBottomSheetOpened: (() => void) | null
}

type DefinedControllerHelpers = {
  DappsController: DappsControllerHelpers
  RequestsController: RequestsControllerHelpers
}

export type ControllerHelpersMapping = {
  [K in keyof AllControllersMappingType]: K extends keyof DefinedControllerHelpers
    ? DefinedControllerHelpers[K]
    : {}
}

export class ControllerHelpersStore {
  #states: Partial<ControllerHelpersMapping> = {}

  #listeners: Map<string, Set<() => void>> = new Map()

  static readonly #EMPTY_STATE = Object.freeze({})

  update<K extends keyof ControllerHelpersMapping>(
    id: K,
    data: Partial<ControllerHelpersMapping[K]>,
    forceEmit?: boolean
  ) {
    if (data === undefined) return

    const prevState = this.#states[id]
    // Helpers hold refs, callbacks and flags, never nested state, so a key holding the
    // same reference holds the same helper. An update where every key already holds
    // what it is being given changes nothing, and re-rendering on it is the no-op the
    // subscribers have no way of catching: they read the whole object, which a rebuild
    // would hand them with a new identity either way.
    const hasChange =
      !prevState ||
      (Object.keys(data) as (keyof ControllerHelpersMapping[K])[]).some(
        (key) => (prevState as ControllerHelpersMapping[K])[key] !== data[key]
      )

    if (!hasChange) return

    this.#states[id] = { ...(prevState ?? {}), ...data } as ControllerHelpersMapping[K]

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

  getSnapshot<K extends keyof ControllerHelpersMapping>(id: K): ControllerHelpersMapping[K] {
    return this.#states[id] || (ControllerHelpersStore.#EMPTY_STATE as ControllerHelpersMapping[K])
  }
}
