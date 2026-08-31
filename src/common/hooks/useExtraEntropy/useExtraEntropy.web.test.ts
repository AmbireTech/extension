/**
 * @jest-environment jsdom
 */
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'

import useExtraEntropy from './useExtraEntropy.web'

afterEach(() => {
  jest.restoreAllMocks()
})

const Consumer = () => {
  useExtraEntropy()

  return null
}

const mountConsumers = (count: number) => {
  // React 18+ refuses to flush effects inside act() without this flag
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

  const root = createRoot(document.createElement('div'))

  act(() => {
    root.render(
      createElement(
        'div',
        null,
        Array.from({ length: count }, (_, i) => createElement(Consumer, { key: `consumer-${i}` }))
      )
    )
  })
}

describe('useExtraEntropy (web)', () => {
  // Guards the two things about the collection wiring that fail silently: a missing source cuts the
  // pool back to the two clocks in takeExtraEntropy, and a per-mount handler folds every event once
  // per mounted consumer - both with nothing failing and nothing logged.
  it('observes both sources, with one listener each however many consumers are mounted', () => {
    const addEventListener = jest.spyOn(document, 'addEventListener')

    // The app-wide BiometricsProvider alongside a screen-level consumer is the everyday case
    mountConsumers(3)

    const listenersByType = (type: string) =>
      new Set(
        addEventListener.mock.calls.filter(([eventType]) => eventType === type).map(([, cb]) => cb)
      )

    // Exactly one distinct callback per source: more than zero means the source reaches the pool at
    // all, and exactly one means the three consumers share a callback, which is what lets
    // addEventListener dedupe them into a single registration rather than folding each event 3x.
    expect(listenersByType('pointermove').size).toBe(1)
    expect(listenersByType('keydown').size).toBe(1)
  })
})
