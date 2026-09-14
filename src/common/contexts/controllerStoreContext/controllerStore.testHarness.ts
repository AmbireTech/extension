import { ControllerStore } from './controllerStore'

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
