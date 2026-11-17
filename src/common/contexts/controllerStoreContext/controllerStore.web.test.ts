import { createStoreHarness } from './controllerStore.testHarness'
import { installFrameStub } from './frameStub.testHarness'

// `@common/config/env` reaches into expo to decide `isDev`, which is untransformed ESM
// under jest and irrelevant here - the store only reads it to toggle the cycle check.
jest.mock('@common/config/env', () => ({ isDev: false }))

// `./ctrlStateCommitter` resolves through a platform suffix the bundler picks, which
// jest's resolver has no notion of. This file is the extension half, so the store is
// given the committer the DOM renderers run on.
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('./ctrlStateCommitter', () => require('./ctrlStateCommitter/ctrlStateCommitter.web'))

/**
 * On the DOM renderers (extension, benzin, legends) a forced update is rendered by
 * `flushSync` before the next one can take its place, so nothing is ever held back.
 * Every difference from `controllerStore.native.test.ts` comes down to that.
 */
describe('ControllerStore (DOM renderers)', () => {
  let frames: ReturnType<typeof installFrameStub>
  let openStores: { destroy: () => void }[] = []

  const createHarness = (...args: Parameters<typeof createStoreHarness>) => {
    const harness = createStoreHarness(...args)
    // The event bus is a module singleton, so a store left listening would take the
    // states of the test after it.
    openStores.push(harness.store)

    return harness
  }

  beforeEach(() => {
    jest.useFakeTimers()
    openStores = []
    frames = installFrameStub()
  })

  afterEach(() => {
    openStores.forEach((store) => store.destroy())
    jest.useRealTimers()
  })

  it('renders a forced burst as it arrives, without waiting on a frame', () => {
    const { update, snapshot, subscriber } = createHarness()
    const seen: string[] = []
    subscriber.mockImplementation(() => seen.push(snapshot().statuses.signAndBroadcast))

    update({ isReady: true, statuses: { signAndBroadcast: 'LOADING' } }, true)
    update({ isReady: true, statuses: { signAndBroadcast: 'SUCCESS' } }, true)
    update({ isReady: true, statuses: { signAndBroadcast: 'INITIAL' } }, true)

    expect(seen).toEqual(['LOADING', 'SUCCESS', 'INITIAL'])
    expect(frames.pendingFrames()).toBe(0)
  })

  it('graduates the routes on the update that carried isReady', () => {
    const { store, update, onReadyToLoadRoutes } = createHarness()

    update({ isReady: false, statuses: { selectAccount: 'LOADING' } }, true)
    expect(store.isReadyToLoadRoutes).toBe(false)

    // The state the committer would be holding back on React Native. Here the routes
    // may graduate at once, because the UI already has it.
    update({ isReady: true, statuses: { selectAccount: 'SUCCESS' } })

    expect(store.isReadyToLoadRoutes).toBe(true)
    expect(onReadyToLoadRoutes).toHaveBeenCalledTimes(1)
  })

  it('holds nothing back, so an update reconciles against the delivered snapshot', () => {
    const { update, snapshot, subscriber } = createHarness()

    // The same three updates the native file queues behind a frame.
    update({ isReady: true, portfolio: { total: 1 } }, true)
    update({ isReady: true, portfolio: { total: 2 } })
    update({ isReady: true, portfolio: { total: 2 } })

    expect(snapshot().portfolio.total).toBe(2)
    // The third update matched what was already delivered, so nothing was handed over
    // for it.
    expect(subscriber).toHaveBeenCalledTimes(2)
  })

  it('exposes the state of a controller nothing is subscribed to', () => {
    const { store, update, snapshot, unsubscribe } = createHarness()
    unsubscribe()

    update({ isReady: true, statuses: { selectAccount: 'SUCCESS' } })

    expect(snapshot().statuses.selectAccount).toBe('SUCCESS')
    expect(store.isReady).toBe(true)
  })

  it('notifies nobody for an emit the reconcile found no change in', () => {
    const { update, snapshot, subscriber } = createHarness()

    update({ isReady: true, accounts: [{ addr: '0x1' }] })
    const delivered = snapshot()

    update({ isReady: true, accounts: [{ addr: '0x1' }] })

    expect(subscriber).toHaveBeenCalledTimes(1)
    expect(snapshot()).toBe(delivered)
  })

  it('reports no readiness for a controller whose state failed to snapshot', () => {
    const { store, update } = createHarness()
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

    update({
      isReady: true,
      toJSON: () => {
        throw new Error('cannot serialize')
      }
    })

    expect(store.isReady).toBe(false)

    consoleError.mockRestore()
  })
})
