import { ControllersMappingType } from '@web/extension-services/background/types'

type ControllerId = keyof ControllersMappingType

export class ControllerStore {
  #states: Partial<ControllersMappingType> = {}
  #listeners: Map<string, Set<() => void>> = new Map()

  update<K extends ControllerId>(id: K, data: ControllersMappingType[K]) {
    this.#states[id] = data
    this.#listeners.get(id as string)?.forEach((cb) => cb())
  }

  subscribe(id: string, listener: () => void) {
    if (!this.#listeners.has(id)) this.#listeners.set(id, new Set())
    this.#listeners.get(id)!.add(listener)
    return () => this.#listeners.get(id)?.delete(listener)
  }

  getSnapshot<K extends ControllerId>(id: K): ControllersMappingType[K] | undefined {
    return this.#states[id]
  }
}
