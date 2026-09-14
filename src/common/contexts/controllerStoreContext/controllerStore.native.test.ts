import eventBus from '@common/services/event/eventBus'

import { CONTROLLER_STORE_MAX_LOADING_TIME } from './controllerStore'
import { createStoreHarness, installFrameStub } from './controllerStore.testHarness'

// `@common/config/env` reaches into expo to decide `isDev`, which is untransformed ESM
// under jest and irrelevant here - the store only reads it to toggle the cycle check.
jest.mock('@common/config/env', () => ({ isDev: false }))

// `./ctrlStateCommitter` resolves through a platform suffix the bundler picks, which
// jest's resolver has no notion of. This file is the mobile half, so the store is given
// the committer React Native runs on.
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('./ctrlStateCommitter', () => require('./ctrlStateCommitter/ctrlStateCommitter.native'))

describe('ControllerStore (React Native)', () => {
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
    // The store arms a timer that reports a boot taking too long, which outlives the
    // test it was armed in.
    jest.useFakeTimers()
    openStores = []
    frames = installFrameStub()
  })

  afterEach(() => {
    openStores.forEach((store) => store.destroy())
    jest.useRealTimers()
  })

  describe('core', () => {
    it('exposes one shared empty state for a controller that has not emitted yet', () => {
      const { store } = createHarness()

      expect(store.getSnapshot('MainController' as any)).toEqual({})
      expect(store.getSnapshot('MainController' as any)).toBe(
        store.getSnapshot('KeystoreController' as any)
      )
    })

    it('delivers the first state and notifies its subscribers', () => {
      const { store, update, snapshot, subscriber } = createHarness()

      update({ isReady: true, accounts: [] })

      expect(subscriber).toHaveBeenCalledTimes(1)
      expect(snapshot().isReady).toBe(true)
      expect(store.initializedControllers.has('MainController' as any)).toBe(true)
    })

    it('notifies nobody for an emit the reconcile found no change in', () => {
      const { update, snapshot, subscriber } = createHarness()

      update({ isReady: true, accounts: [{ addr: '0x1' }] })
      const delivered = snapshot()

      // The very content it already holds, in objects of its own - what a controller
      // that re-emits without having changed anything hands over.
      update({ isReady: true, accounts: [{ addr: '0x1' }] })

      expect(subscriber).toHaveBeenCalledTimes(1)
      expect(snapshot()).toBe(delivered)
    })

    it('keeps the identity of every branch the update did not touch', () => {
      const { update, snapshot } = createHarness()

      update({ isReady: true, portfolio: { total: 1 }, keys: { count: 2 } })
      const before = snapshot()

      update({ isReady: true, portfolio: { total: 5 }, keys: { count: 2 } })
      const after = snapshot()

      expect(after).not.toBe(before)
      expect(after.portfolio).not.toBe(before.portfolio)
      // A selector reading this one returns the very reference it returned before, so
      // its subscriber exits on a reference check instead of re-rendering.
      expect(after.keys).toBe(before.keys)
    })

    it('detaches the snapshot from the state the controller handed over', () => {
      const { update, snapshot } = createHarness()

      // Mandatory where the controllers run in this same realm: the state they hand over
      // still holds their live objects, so a snapshot sharing them would mutate with them
      // and every comparison against it would report no change.
      const live = { isReady: true, portfolio: { total: 1 } }
      update(live)
      live.portfolio.total = 999

      expect(snapshot().portfolio.total).toBe(1)
    })

    it('delivers a forced emit even when it changed nothing', () => {
      const { update, subscriber } = createHarness()

      update({ isReady: true, statuses: { signAndBroadcast: 'INITIAL' } })
      update({ isReady: true, statuses: { signAndBroadcast: 'INITIAL' } }, true)

      expect(subscriber).toHaveBeenCalledTimes(2)
    })

    it('keeps the previous snapshot when a state cannot be snapshotted', () => {
      const { store, update, snapshot } = createHarness()
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

      update({ isReady: true, accounts: [] })
      const delivered = snapshot()

      update({
        isReady: true,
        toJSON: () => {
          throw new Error('cannot serialize')
        }
      })

      expect(consoleError).toHaveBeenCalled()
      expect(snapshot()).toBe(delivered)
      expect(store.isReady).toBe(true)

      consoleError.mockRestore()
    })

    it('reports no readiness for a controller whose first state failed to snapshot', () => {
      const { store, update } = createHarness()
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

      update({
        isReady: true,
        toJSON: () => {
          throw new Error('cannot serialize')
        }
      })

      expect(store.isReady).toBe(false)
      expect(store.isReadyToLoadRoutes).toBe(false)

      consoleError.mockRestore()
    })

    it('answers readiness for a subset of controllers instead of the whole store', () => {
      const { store, update } = createHarness({
        controllers: ['MainController', 'KeystoreController'],
        critical: ['MainController']
      })

      update({ isReady: true })

      expect(store.areControllersReady(['MainController'] as any)).toBe(true)
      expect(store.areControllersReady(['MainController', 'KeystoreController'] as any)).toBe(false)
      expect(store.isReady).toBe(false)
    })

    it('does not wait on the controllers the platform loads after the first paint', () => {
      const { store, update, onReady } = createHarness({
        controllers: ['MainController', 'PortfolioController'],
        critical: ['MainController'],
        deferred: ['PortfolioController']
      })

      update({ isReady: true })

      expect(store.isReady).toBe(true)
      expect(onReady).toHaveBeenCalledTimes(1)
    })

    it('graduates the routes when the critical set is narrowed to what is ready', () => {
      const { store, update, onReadyToLoadRoutes } = createHarness({
        controllers: ['MainController', 'KeystoreController'],
        critical: ['MainController', 'KeystoreController']
      })

      update({ isReady: true })
      expect(store.isReadyToLoadRoutes).toBe(false)

      // What the platform does once it knows which route it is opening.
      store.setCriticalControllers(['MainController'] as any)

      expect(store.isReadyToLoadRoutes).toBe(true)
      expect(onReadyToLoadRoutes).toHaveBeenCalledTimes(1)
    })

    it('takes states off the event bus until it is destroyed', () => {
      const { store, snapshot } = createHarness()

      eventBus.emit('ctrlUpdate', {
        ctrlName: 'MainController',
        ctrlState: { isReady: true, accounts: [] }
      })
      expect(snapshot().isReady).toBe(true)

      store.destroy()
      eventBus.emit('ctrlUpdate', {
        ctrlName: 'MainController',
        ctrlState: { isReady: true, accounts: [{ addr: '0x1' }] }
      })

      expect(snapshot().accounts).toEqual([])
    })

    it('reports a boot that is taking too long', () => {
      const { store } = createHarness()
      const events = jest.fn()
      store.addEventsListener(events)

      jest.advanceTimersByTime(CONTROLLER_STORE_MAX_LOADING_TIME)

      expect(events).toHaveBeenCalledWith('controllersLoadingTakingTooLong')
    })

    it('reports nothing when the controllers landed in time', () => {
      const { store, update } = createHarness()
      const events = jest.fn()
      store.addEventsListener(events)

      update({ isReady: true })
      jest.advanceTimersByTime(CONTROLLER_STORE_MAX_LOADING_TIME)

      expect(events).not.toHaveBeenCalledWith('controllersLoadingTakingTooLong')
    })

    it('stops notifying a subscriber that unsubscribed', () => {
      const { update, subscriber, unsubscribe } = createHarness()

      update({ isReady: true, accounts: [] })
      unsubscribe()
      update({ isReady: true, accounts: [{ addr: '0x1' }] })

      expect(subscriber).toHaveBeenCalledTimes(1)
    })
  })

  /**
   * React Native has no `flushSync`, so the snapshots are paced out one per controller
   * per frame instead of flushed. Everything below is what that pacing costs the store,
   * and none of it happens on the DOM renderers.
   */
  describe('pacing', () => {
    it('hands every forced state of a burst to the subscribers, one per frame', () => {
      const { update, snapshot, subscriber } = createHarness()
      const seen: string[] = []
      subscriber.mockImplementation(() => seen.push(snapshot().statuses.signAndBroadcast))

      update({ isReady: true, statuses: { signAndBroadcast: 'LOADING' } }, true)
      update({ isReady: true, statuses: { signAndBroadcast: 'SUCCESS' } }, true)
      update({ isReady: true, statuses: { signAndBroadcast: 'INITIAL' } }, true)

      expect(seen).toEqual(['LOADING'])

      frames.runFrame()
      expect(seen).toEqual(['LOADING', 'SUCCESS'])

      frames.runFrame()
      expect(seen).toEqual(['LOADING', 'SUCCESS', 'INITIAL'])
    })

    it('reconciles an update against the snapshot queued ahead of it', () => {
      const { update, snapshot, subscriber } = createHarness()

      update({ isReady: true, portfolio: { total: 1 } }, true)
      update({ isReady: true, portfolio: { total: 2 } })
      // The very content already queued. Reconciled against the delivered snapshot
      // instead, this would read as a change and queue a second hand-over.
      update({ isReady: true, portfolio: { total: 2 } })

      frames.runFrame()

      expect(snapshot().portfolio.total).toBe(2)
      expect(subscriber).toHaveBeenCalledTimes(2)
      expect(frames.pendingFrames()).toBe(0)
    })

    it('paces nothing for a controller nothing is subscribed to', () => {
      const { store, update, snapshot, unsubscribe } = createHarness()
      unsubscribe()

      update({ isReady: true, statuses: { selectAccount: 'LOADING' } }, true)
      update({ isReady: true, statuses: { selectAccount: 'SUCCESS' } }, true)

      expect(snapshot().statuses.selectAccount).toBe('SUCCESS')
      expect(store.isReady).toBe(true)
      expect(frames.pendingFrames()).toBe(0)
    })

    it('drops what is held back on destroy', () => {
      const { store, update, snapshot } = createHarness()

      update({ isReady: true, portfolio: { total: 1 } }, true)
      update({ isReady: true, portfolio: { total: 2 } })
      store.destroy()

      frames.runFrame()

      expect(snapshot().portfolio.total).toBe(1)
    })
  })

  /**
   * The routes render as soon as the controllers they need report ready, and they render
   * off what the store has delivered. So a readiness flag that arrives in a snapshot the
   * committer is still holding back must not graduate the store before the UI can see it.
   */
  describe('readiness while a snapshot is held back', () => {
    it('waits for the snapshot that carries isReady to reach the UI', () => {
      const { store, update, snapshot, onReadyToLoadRoutes } = createHarness()

      update({ isReady: false, statuses: { selectAccount: 'INITIAL' } })
      expect(store.isReadyToLoadRoutes).toBe(false)

      // Leaves a forced state in front of the UI, which is what makes the committer hold
      // everything committed after it until the frame boundary.
      update({ isReady: false, statuses: { selectAccount: 'LOADING' } }, true)
      update({ isReady: true, statuses: { selectAccount: 'SUCCESS' } })

      expect(store.isReadyToLoadRoutes).toBe(false)
      expect(onReadyToLoadRoutes).not.toHaveBeenCalled()
      expect(snapshot().isReady).toBe(false)
    })

    it('graduates the routes on the frame that hands that snapshot over', () => {
      const { store, update, snapshot, onReadyToLoadRoutes } = createHarness()

      update({ isReady: false, statuses: { selectAccount: 'INITIAL' } })
      update({ isReady: false, statuses: { selectAccount: 'LOADING' } }, true)
      update({ isReady: true, statuses: { selectAccount: 'SUCCESS' } })

      frames.runFrame()

      expect(snapshot().isReady).toBe(true)
      expect(store.isReadyToLoadRoutes).toBe(true)
      expect(onReadyToLoadRoutes).toHaveBeenCalledTimes(1)
    })
  })
})
