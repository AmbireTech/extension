import { ControllerStore } from './controllerStore'

/**
 * Stands in for the frame the native committer paces its hand-overs on. The DOM
 * committer asks for none, which is what `pendingFrames` is there to assert.
 */
export const installFrameStub = () => {
  let frameCallbacks: (() => void)[] = []

  ;(global as any).requestAnimationFrame = (callback: () => void) => {
    frameCallbacks.push(callback)

    return 0
  }

  return {
    runFrame: () => {
      const callbacks = frameCallbacks
      frameCallbacks = []
      callbacks.forEach((callback) => callback())
    },
    pendingFrames: () => frameCallbacks.length
  }
}

/**
 * A store wired to one controller, subscribed to, so the committer treats its states as
 * something that renders. The names are real controller names only because the store is
 * typed on them - nothing here reads a controller.
 */
export const createStoreHarness = ({
  controllers = ['MainController'],
  critical = ['MainController'],
  deferred = []
}: { controllers?: string[]; critical?: string[]; deferred?: string[] } = {}) => {
  const onReady = jest.fn()
  const onReadyToLoadRoutes = jest.fn()
  const store = new ControllerStore({ onReady, onReadyToLoadRoutes })

  store.init(controllers as any, critical as any, undefined, deferred as any)

  const subscriber = jest.fn()
  const unsubscribe = store.subscribe('MainController', subscriber)

  return {
    store,
    onReady,
    onReadyToLoadRoutes,
    subscriber,
    unsubscribe,
    update: (state: any, forceEmit?: boolean) =>
      store.update('MainController' as any, state, forceEmit),
    snapshot: () => store.getSnapshot('MainController' as any) as any
  }
}
