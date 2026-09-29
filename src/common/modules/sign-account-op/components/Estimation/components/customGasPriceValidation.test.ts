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
})
