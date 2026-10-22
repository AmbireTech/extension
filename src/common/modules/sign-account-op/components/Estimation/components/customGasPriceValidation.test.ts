import { validateCustomGasPrice } from './customGasPriceValidation'

const validInput = {
  maxFeePerGas: '0.1',
  maxPriorityFeePerGas: '0.01',
  gas: '250000',
  is1559: true,
  canSetCustomGas: true
}

describe('validateCustomGasPrice', () => {
  test('returns the parsed values when all the fields are valid', () => {
    expect(validateCustomGasPrice(validInput)).toEqual({
      errors: {},
      values: {
        maxFeePerGas: 100000000n,
        maxPriorityFeePerGas: 10000000n,
        gas: 250000n
      }
    })
  })

  test('accepts a comma as the decimal separator', () => {
    const { values } = validateCustomGasPrice({ ...validInput, maxFeePerGas: ' 0,1 ' })

    expect(values?.maxFeePerGas).toBe(100000000n)
  })

  test('marks only the max fee when only the max fee is not valid', () => {
    expect(validateCustomGasPrice({ ...validInput, maxFeePerGas: '0' })).toEqual({
      errors: { maxFeePerGas: 'invalid' },
      values: null
    })
  })

  test('marks only the max priority fee when only the max priority fee is not valid', () => {
    expect(validateCustomGasPrice({ ...validInput, maxPriorityFeePerGas: '' })).toEqual({
      errors: { maxPriorityFeePerGas: 'invalid' },
      values: null
    })
  })

  test('marks only the gas limit when the gas limit is not a whole number', () => {
    expect(validateCustomGasPrice({ ...validInput, gas: '250000.5' })).toEqual({
      errors: { gas: 'invalid' },
      values: null
    })
  })

  test('marks each field that is not valid', () => {
    expect(
      validateCustomGasPrice({
        ...validInput,
        maxFeePerGas: 'abc',
        maxPriorityFeePerGas: '-1',
        gas: '0'
      })
    ).toEqual({
      errors: { maxFeePerGas: 'invalid', maxPriorityFeePerGas: 'invalid', gas: 'invalid' },
      values: null
    })
  })

  test('marks the fees that have more decimals than gwei allows', () => {
    expect(
      validateCustomGasPrice({
        ...validInput,
        maxFeePerGas: '0.0264607201',
        maxPriorityFeePerGas: '0.0001323031'
      })
    ).toEqual({
      errors: { maxFeePerGas: 'tooManyDecimals', maxPriorityFeePerGas: 'tooManyDecimals' },
      values: null
    })
  })

  test('accepts fees with exactly 9 decimals', () => {
    const { values } = validateCustomGasPrice({
      ...validInput,
      maxFeePerGas: '0.026460720',
      maxPriorityFeePerGas: '0.000132303'
    })

    expect(values?.maxFeePerGas).toBe(26460720n)
    expect(values?.maxPriorityFeePerGas).toBe(132303n)
  })

  test('marks the max priority fee when it is higher than the max fee', () => {
    expect(validateCustomGasPrice({ ...validInput, maxPriorityFeePerGas: '0.2' })).toEqual({
      errors: { maxPriorityFeePerGas: 'aboveMaxFee' },
      values: null
    })
  })

  test('does not validate the max priority fee on networks without EIP-1559', () => {
    expect(
      validateCustomGasPrice({ ...validInput, is1559: false, maxPriorityFeePerGas: '' })
    ).toEqual({
      errors: {},
      values: { maxFeePerGas: 100000000n, maxPriorityFeePerGas: 0n, gas: 250000n }
    })
  })

  test('does not validate the gas limit when it cannot be set', () => {
    expect(validateCustomGasPrice({ ...validInput, canSetCustomGas: false, gas: '' })).toEqual({
      errors: {},
      values: { maxFeePerGas: 100000000n, maxPriorityFeePerGas: 10000000n }
    })
  })

  describe('when speeding up a transaction', () => {
    // 0.1 gwei max fee and 0.01 gwei tip
    const speedUpMinFees = { maxFeePerGas: 100000000n, maxPriorityFeePerGas: 10000000n }

    test('accepts fees exactly at the minimum', () => {
      expect(validateCustomGasPrice({ ...validInput, speedUpMinFees }).errors).toEqual({})
    })

    test('accepts fees above the minimum', () => {
      const { errors, values } = validateCustomGasPrice({
        ...validInput,
        maxFeePerGas: '0.2',
        maxPriorityFeePerGas: '0.02',
        speedUpMinFees
      })

      expect(errors).toEqual({})
      expect(values?.maxFeePerGas).toBe(200000000n)
    })

    test('marks the max fee and blocks saving when it is below the minimum', () => {
      expect(
        validateCustomGasPrice({ ...validInput, maxFeePerGas: '0.099999999', speedUpMinFees })
      ).toEqual({ errors: { maxFeePerGas: 'belowSpeedUpMinimum' }, values: null })
    })

    test('marks the max priority fee and blocks saving when it is below the minimum', () => {
      expect(
        validateCustomGasPrice({
          ...validInput,
          maxPriorityFeePerGas: '0.009999999',
          speedUpMinFees
        })
      ).toEqual({ errors: { maxPriorityFeePerGas: 'belowSpeedUpMinimum' }, values: null })
    })

    test('marks both fees when both are below the minimum', () => {
      expect(
        validateCustomGasPrice({
          ...validInput,
          maxFeePerGas: '0.05',
          maxPriorityFeePerGas: '0.005',
          speedUpMinFees
        }).errors
      ).toEqual({
        maxFeePerGas: 'belowSpeedUpMinimum',
        maxPriorityFeePerGas: 'belowSpeedUpMinimum'
      })
    })

    test('still shows the more basic errors first', () => {
      expect(
        validateCustomGasPrice({
          ...validInput,
          maxFeePerGas: '0',
          maxPriorityFeePerGas: '0.2',
          speedUpMinFees
        }).errors
      ).toEqual({ maxFeePerGas: 'invalid' })
      expect(
        validateCustomGasPrice({ ...validInput, maxPriorityFeePerGas: '0.2', speedUpMinFees })
          .errors
      ).toEqual({ maxPriorityFeePerGas: 'aboveMaxFee' })
    })

    test('does not check the max priority fee on networks without EIP-1559', () => {
      expect(
        validateCustomGasPrice({
          ...validInput,
          is1559: false,
          maxPriorityFeePerGas: '',
          speedUpMinFees
        }).errors
      ).toEqual({})
    })

    test('does not apply any minimum when not speeding up', () => {
      expect(validateCustomGasPrice({ ...validInput, maxFeePerGas: '0.05' }).errors).toEqual({})
    })
  })
})
