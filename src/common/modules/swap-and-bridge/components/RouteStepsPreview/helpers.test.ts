import {
  getLastRouteStepType,
  getRouteExtraBridgeFeeInUsd,
  getRouteNetworkFeeInUsd
} from './helpers'

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

describe('getRouteNetworkFeeInUsd', () => {
  test('returns the gap between the output value and the output value after gas', () => {
    expect(
      getRouteNetworkFeeInUsd({ outputValueInUsd: 9.95, outputValueAfterGasInUsd: 9.64 })
    ).toBeCloseTo(0.31)
  })

  test('returns undefined when the provider does not send a value after gas', () => {
    expect(getRouteNetworkFeeInUsd({ outputValueInUsd: 9.95 })).toBeUndefined()
  })

  test('returns undefined when there is no fee', () => {
    expect(
      getRouteNetworkFeeInUsd({ outputValueInUsd: 9.95, outputValueAfterGasInUsd: 9.95 })
    ).toBeUndefined()
  })

  test('returns undefined when the value after gas is higher than the output value', () => {
    expect(
      getRouteNetworkFeeInUsd({ outputValueInUsd: 9.95, outputValueAfterGasInUsd: 10 })
    ).toBeUndefined()
  })

  test('returns undefined when the values are not finite numbers', () => {
    expect(
      getRouteNetworkFeeInUsd({ outputValueInUsd: NaN, outputValueAfterGasInUsd: 9.95 })
    ).toBeUndefined()
    expect(
      getRouteNetworkFeeInUsd({ outputValueInUsd: Infinity, outputValueAfterGasInUsd: 9.95 })
    ).toBeUndefined()
  })
})

describe('getRouteExtraBridgeFeeInUsd', () => {
  test('returns the extra bridge fee in USD', () => {
    expect(
      getRouteExtraBridgeFeeInUsd({ serviceFee: { amount: '100000000000000', amountUSD: '0.42' } })
    ).toBe(0.42)
  })

  test('returns undefined when the route has no extra bridge fee', () => {
    expect(getRouteExtraBridgeFeeInUsd({})).toBeUndefined()
  })

  test('returns undefined when the extra bridge fee is zero', () => {
    expect(
      getRouteExtraBridgeFeeInUsd({ serviceFee: { amount: '0', amountUSD: '0' } })
    ).toBeUndefined()
  })

  test('returns undefined when the extra bridge fee is not a number', () => {
    expect(
      getRouteExtraBridgeFeeInUsd({ serviceFee: { amount: '1', amountUSD: 'unknown' } })
    ).toBeUndefined()
  })
})
