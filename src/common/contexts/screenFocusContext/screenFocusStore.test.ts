import {
  createScreenFocusStore,
  RUN_WHEN_ON_TOP_TIMEOUT_MS,
  runWhenScreenIsOnTop
} from './screenFocusStore'

jest.mock('@common/config/env', () => ({ isDev: false }))

describe('runWhenScreenIsOnTop', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('runs at once on the screen on top', () => {
    const store = createScreenFocusStore(true)
    const run = jest.fn()

    runWhenScreenIsOnTop(store, 'action', run)

    expect(run).toHaveBeenCalledTimes(1)
  })

  it('refuses a screen further back that nobody is touching', () => {
    const store = createScreenFocusStore(false)
    const run = jest.fn()

    runWhenScreenIsOnTop(store, 'action', run)
    store.setIsFocused(true)

    expect(run).not.toHaveBeenCalled()
  })

  it('holds a tap on a screen the stack has not committed as the top one until it is', () => {
    const store = createScreenFocusStore(false)
    const run = jest.fn()
    store.setIsTouched(true)

    runWhenScreenIsOnTop(store, 'action', run)
    expect(run).not.toHaveBeenCalled()

    store.setIsFocused(true)
    expect(run).toHaveBeenCalledTimes(1)
    expect(jest.getTimerCount()).toBe(0)
  })

  it('holds every action of the same tap, in order', () => {
    const store = createScreenFocusStore(false)
    const calls: string[] = []
    store.setIsTouched(true)

    runWhenScreenIsOnTop(store, 'first', () => calls.push('first'))
    runWhenScreenIsOnTop(store, 'second', () => calls.push('second'))
    store.setIsFocused(true)

    expect(calls).toEqual(['first', 'second'])
  })

  it('drops a second tap while the first one waits', () => {
    const store = createScreenFocusStore(false)
    const firstTap = jest.fn()
    const secondTap = jest.fn()

    store.setIsTouched(true)
    runWhenScreenIsOnTop(store, 'action', firstTap)
    store.setIsTouched(false)
    store.setIsTouched(true)
    runWhenScreenIsOnTop(store, 'action', secondTap)
    store.setIsFocused(true)

    expect(firstTap).toHaveBeenCalledTimes(1)
    expect(secondTap).not.toHaveBeenCalled()
  })

  it('expires a held action when the screen does not come on top in time', () => {
    const store = createScreenFocusStore(false)
    const run = jest.fn()
    store.setIsTouched(true)

    runWhenScreenIsOnTop(store, 'action', run)
    jest.advanceTimersByTime(RUN_WHEN_ON_TOP_TIMEOUT_MS)
    store.setIsFocused(true)

    expect(run).not.toHaveBeenCalled()
  })

  it('holds a new tap again once an expired one is gone', () => {
    const store = createScreenFocusStore(false)
    const run = jest.fn()
    store.setIsTouched(true)

    runWhenScreenIsOnTop(store, 'action', jest.fn())
    jest.advanceTimersByTime(RUN_WHEN_ON_TOP_TIMEOUT_MS)
    store.setIsTouched(true)
    runWhenScreenIsOnTop(store, 'action', run)
    store.setIsFocused(true)

    expect(run).toHaveBeenCalledTimes(1)
  })

  it('drops held actions and their timer when the screen goes away', () => {
    const store = createScreenFocusStore(false)
    const run = jest.fn()
    store.setIsTouched(true)

    runWhenScreenIsOnTop(store, 'action', run)
    store.cancelDeferred()
    store.setIsFocused(true)

    expect(run).not.toHaveBeenCalled()
    expect(jest.getTimerCount()).toBe(0)
  })

  it('does not run held actions when the screen loses focus', () => {
    const store = createScreenFocusStore(false)
    const run = jest.fn()
    store.setIsTouched(true)

    runWhenScreenIsOnTop(store, 'action', run)
    store.setIsFocused(false)

    expect(run).not.toHaveBeenCalled()
  })
})
