import {
  formatRouteToTokenAmount,
  getLastRouteStepType,
  getRouteExtraBridgeFeeLabel,
  getRouteMinReceiveAmount,
  getRouteNetworkFeeInToToken,
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

describe('getRouteExtraBridgeFeeLabel', () => {
  test('returns the extra bridge fee in the native token', () => {
    expect(
      getRouteExtraBridgeFeeLabel(
        { serviceFee: { amount: '120000000000000', amountUSD: '0.42' } },
        'ETH'
      )
    ).toBe('0.00012 ETH')
  })

  test('returns the USD amount with a dollar sign when the native symbol is unknown', () => {
    expect(
      getRouteExtraBridgeFeeLabel({ serviceFee: { amount: '120000000000000', amountUSD: '0.42' } })
    ).toBe('$0.42')
  })

  test('returns the USD amount when the native amount is invalid', () => {
    expect(
      getRouteExtraBridgeFeeLabel({ serviceFee: { amount: 'unknown', amountUSD: '0.42' } }, 'ETH')
    ).toBe('$0.42')
  })

  test('returns undefined when the route has no extra bridge fee', () => {
    expect(getRouteExtraBridgeFeeLabel({}, 'ETH')).toBeUndefined()
  })

  test('returns undefined when the extra bridge fee is zero', () => {
    expect(
      getRouteExtraBridgeFeeLabel({ serviceFee: { amount: '0', amountUSD: '0' } }, 'ETH')
    ).toBeUndefined()
  })

  test('returns undefined when neither amount is valid', () => {
    expect(
      getRouteExtraBridgeFeeLabel({ serviceFee: { amount: '1.5', amountUSD: 'unknown' } }, 'ETH')
    ).toBeUndefined()
  })
})

describe('getRouteNetworkFeeInToToken', () => {
  test('returns the network fee taken from the received tokens', () => {
    expect(getRouteNetworkFeeInToToken({ networkFeeInToToken: '720' })).toBe(720n)
  })

  test('returns undefined for providers that charge the network fee to the account', () => {
    expect(getRouteNetworkFeeInToToken({})).toBeUndefined()
  })

  test('returns undefined when the fee is zero', () => {
    expect(getRouteNetworkFeeInToToken({ networkFeeInToToken: '0' })).toBeUndefined()
  })

  test('returns undefined when the fee is negative', () => {
    expect(getRouteNetworkFeeInToToken({ networkFeeInToToken: '-1' })).toBeUndefined()
  })

  test('returns undefined when the fee is not a whole number', () => {
    expect(getRouteNetworkFeeInToToken({ networkFeeInToToken: '0.5' })).toBeUndefined()
    expect(getRouteNetworkFeeInToToken({ networkFeeInToToken: 'unknown' })).toBeUndefined()
  })
})

describe('getRouteMinReceiveAmount', () => {
  const makeUserTx = (minAmountOut: string) => ({ minAmountOut }) as any

  test('returns the min amount out of the last user tx', () => {
    expect(getRouteMinReceiveAmount({ userTxs: [makeUserTx('5000'), makeUserTx('994000')] })).toBe(
      994000n
    )
  })

  test('returns undefined when the route has no user txs', () => {
    expect(getRouteMinReceiveAmount({ userTxs: [] })).toBeUndefined()
  })

  test('returns undefined when the min amount out is zero', () => {
    expect(getRouteMinReceiveAmount({ userTxs: [makeUserTx('0')] })).toBeUndefined()
  })

  test('returns undefined when the min amount out is not a whole number', () => {
    expect(getRouteMinReceiveAmount({ userTxs: [makeUserTx('')] })).toBeUndefined()
    expect(getRouteMinReceiveAmount({ userTxs: [makeUserTx('1.5')] })).toBeUndefined()
  })
})

describe('formatRouteToTokenAmount', () => {
  test('formats the amount with the token decimals and symbol', () => {
    expect(formatRouteToTokenAmount(994000n, { decimals: 6, symbol: 'USDT' })).toBe('0.994 USDT')
  })
})
