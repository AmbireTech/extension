import { getLastRouteStepType } from './helpers'

describe('getLastRouteStepType', () => {
  test('keeps a single-step route loading after its user transaction completes', () => {
    expect(
      getLastRouteStepType({
        routeStatus: 'in-progress',
        userTxIndex: 0,
        currentStep: 1,
        isOnlyOneStep: true
      })
    ).toBe('default')
  })

  test('marks a single-step route successful only when the route completes', () => {
    expect(
      getLastRouteStepType({
        routeStatus: 'completed',
        userTxIndex: 0,
        currentStep: 1,
        isOnlyOneStep: true
      })
    ).toBe('success')
  })

  test('does not mark a failed single-step route successful', () => {
    expect(
      getLastRouteStepType({
        routeStatus: 'failed',
        userTxIndex: 0,
        currentStep: 1,
        isOnlyOneStep: true
      })
    ).toBe('default')
  })

  test('keeps completed source steps green on a pending multi-step route', () => {
    expect(
      getLastRouteStepType({
        routeStatus: 'in-progress',
        userTxIndex: 0,
        currentStep: 1,
        isOnlyOneStep: false
      })
    ).toBe('success')
  })

  test('shows the warning state for a refunded single-step route', () => {
    expect(
      getLastRouteStepType({
        routeStatus: 'refunded',
        userTxIndex: 0,
        currentStep: 1,
        isOnlyOneStep: true
      })
    ).toBe('warning')
  })
})
