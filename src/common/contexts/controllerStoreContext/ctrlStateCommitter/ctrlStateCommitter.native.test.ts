import { createCtrlStateCommitter } from './ctrlStateCommitter.native'

/**
 * `withStatus` drives INITIAL -> LOADING -> SUCCESS -> INITIAL through forced emits that
 * the platform can hand JS in a single task, and React Native has no `flushSync` to
 * render each one with. So every one of them has to be handed over on a frame of its own.
 */
describe('createCtrlStateCommitter (native)', () => {
  let frameCallbacks: (() => void)[] = []

  const runFrame = () => {
    const callbacks = frameCallbacks
    frameCallbacks = []
    callbacks.forEach((callback) => callback())
  }

  beforeEach(() => {
    frameCallbacks = []
    ;(global as any).requestAnimationFrame = (callback: () => void) => {
      frameCallbacks.push(callback)
      return 0
    }
  })

  const createHarness = ({ isSubscribed = true }: { isSubscribed?: boolean } = {}) => {
    const delivered: string[] = []
    const committer = createCtrlStateCommitter((_id, state) => {
      delivered.push(state.statuses.selectAccount)

      return isSubscribed
    })

    const commitStatus = (status: string, forceEmit = true) =>
      committer.commit('MainController', { statuses: { selectAccount: status } }, forceEmit)

    return { committer, delivered, commitStatus }
  }

  it('hands over every forced state of a burst, in order, one per frame', () => {
    const { delivered, commitStatus } = createHarness()

    commitStatus('LOADING')
    commitStatus('SUCCESS')
    commitStatus('INITIAL')

    expect(delivered).toEqual(['LOADING'])

    runFrame()
    expect(delivered).toEqual(['LOADING', 'SUCCESS'])

    runFrame()
    expect(delivered).toEqual(['LOADING', 'SUCCESS', 'INITIAL'])
  })

  it('keeps a plain update behind the forced state it would have replaced', () => {
    const { committer, delivered, commitStatus } = createHarness()

    commitStatus('SUCCESS')
    commitStatus('INITIAL', false)

    expect(delivered).toEqual(['SUCCESS'])
    // The store reconciles against what is still held back, not against what it sent.
    expect(committer.pendingStateOf('MainController').statuses.selectAccount).toBe('INITIAL')

    runFrame()
    expect(delivered).toEqual(['SUCCESS', 'INITIAL'])
    expect(committer.pendingStateOf('MainController')).toBeUndefined()
  })

  it('keeps a plain update behind the ones already queued ahead of it', () => {
    const { delivered, commitStatus } = createHarness()

    commitStatus('SUCCESS')
    commitStatus('LOADING', false)
    commitStatus('INITIAL', false)

    expect(delivered).toEqual(['SUCCESS'])

    // Drains the first of the two held updates, which leaves the second still queued
    // while nothing forced is in front of the UI any more.
    runFrame()
    expect(delivered).toEqual(['SUCCESS', 'LOADING'])

    commitStatus('SIGNING', false)

    runFrame()
    runFrame()
    expect(delivered).toEqual(['SUCCESS', 'LOADING', 'INITIAL', 'SIGNING'])
  })

  it('paces nothing while a plain update is the last one delivered', () => {
    const { delivered, commitStatus } = createHarness()

    commitStatus('INITIAL', false)
    commitStatus('LOADING', false)

    expect(delivered).toEqual(['INITIAL', 'LOADING'])
    expect(frameCallbacks).toHaveLength(0)
  })

  it('paces nothing for a controller nothing is subscribed to', () => {
    const { delivered, commitStatus } = createHarness({ isSubscribed: false })

    commitStatus('LOADING')
    commitStatus('SUCCESS')

    expect(delivered).toEqual(['LOADING', 'SUCCESS'])
    expect(frameCallbacks).toHaveLength(0)
  })

  it('drops what it holds back on destroy', () => {
    const { committer, delivered, commitStatus } = createHarness()

    commitStatus('SUCCESS')
    commitStatus('INITIAL')
    committer.destroy()

    runFrame()
    expect(delivered).toEqual(['SUCCESS'])
  })
})
