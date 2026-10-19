import { parseUnits } from 'ethers'

/** The gas values that the user can set manually in the advanced gas options. */
export type CustomGasPriceField = 'maxFeePerGas' | 'maxPriorityFeePerGas' | 'gas'

/**
 * Why a custom gas value is not valid:
 * - `invalid` - the value is empty, is not a number, or is not greater than 0
 * - `tooManyDecimals` - the fee has more decimals than gwei allows (the smallest unit is 1 wei)
 * - `aboveMaxFee` - the max priority fee is higher than the max fee per gas
 */
export type CustomGasPriceErrorReason = 'invalid' | 'tooManyDecimals' | 'aboveMaxFee'

/** The validation errors, one per field, so that each input shows only its own error. */
export type CustomGasPriceErrors = Partial<Record<CustomGasPriceField, CustomGasPriceErrorReason>>

/** The parsed custom gas values, in wei for the fees and in gas units for the gas limit. */
export type CustomGasPriceValues = {
  maxFeePerGas: bigint
  maxPriorityFeePerGas: bigint
  gas?: bigint
}

type CustomGasPriceInput = {
  /** The max fee per gas in gwei, as the user typed it */
  maxFeePerGas: string
  /** The max priority fee in gwei, as the user typed it */
  maxPriorityFeePerGas: string
  /** The gas limit, as the user typed it */
  gas: string
  is1559: boolean
  canSetCustomGas: boolean
}

/** The max number of decimals a fee in gwei can have, because 1 gwei = 10^9 wei. */
export const GWEI_DECIMALS = 9

/** Makes a value that the user typed ready to parse. Accepts a comma as the decimal separator. */
export const normalizeCustomGasValue = (value: string) => value.trim().replace(',', '.')

const getDecimalsCount = (value: string) => value.split('.')[1]?.length ?? 0

const getGweiErrorReason = (value: string): CustomGasPriceErrorReason =>
  getDecimalsCount(value) > GWEI_DECIMALS ? 'tooManyDecimals' : 'invalid'

const parsePositiveGwei = (value: string): bigint | null => {
  if (!value) return null

  try {
    const parsedValue = parseUnits(value, 'gwei')

    return parsedValue > 0n ? parsedValue : null
  } catch {
    // Not a number, or it has more decimals than gwei allows. The caller shows this as a field error
    return null
  }
}

const parsePositiveWholeNumber = (value: string): bigint | null => {
  if (!value) return null

  try {
    const parsedValue = BigInt(value)

    return parsedValue > 0n ? parsedValue : null
  } catch {
    // Not a whole number. The caller shows this as a field error
    return null
  }
}

/**
 * Validates each custom gas field separately.
 * Returns the parsed `values` only when all the fields are valid, otherwise returns the `errors`
 * of the fields that are not valid.
 */
export const validateCustomGasPrice = ({
  maxFeePerGas,
  maxPriorityFeePerGas,
  gas,
  is1559,
  canSetCustomGas
}: CustomGasPriceInput): { errors: CustomGasPriceErrors; values: CustomGasPriceValues | null } => {
  const errors: CustomGasPriceErrors = {}

  const normalizedMaxFeePerGas = normalizeCustomGasValue(maxFeePerGas)
  const parsedMaxFeePerGas = parsePositiveGwei(normalizedMaxFeePerGas)
  if (parsedMaxFeePerGas === null) errors.maxFeePerGas = getGweiErrorReason(normalizedMaxFeePerGas)

  const normalizedMaxPriorityFeePerGas = normalizeCustomGasValue(maxPriorityFeePerGas)
  const parsedMaxPriorityFeePerGas = is1559 ? parsePositiveGwei(normalizedMaxPriorityFeePerGas) : 0n
  if (parsedMaxPriorityFeePerGas === null) {
    errors.maxPriorityFeePerGas = getGweiErrorReason(normalizedMaxPriorityFeePerGas)
  } else if (parsedMaxFeePerGas !== null && parsedMaxPriorityFeePerGas > parsedMaxFeePerGas) {
    errors.maxPriorityFeePerGas = 'aboveMaxFee'
  }

  const parsedGas = canSetCustomGas ? parsePositiveWholeNumber(normalizeCustomGasValue(gas)) : null
  if (canSetCustomGas && parsedGas === null) errors.gas = 'invalid'

  if (
    Object.keys(errors).length ||
    parsedMaxFeePerGas === null ||
    parsedMaxPriorityFeePerGas === null
  ) {
    return { errors, values: null }
  }

  return {
    errors,
    values: {
      maxFeePerGas: parsedMaxFeePerGas,
      maxPriorityFeePerGas: parsedMaxPriorityFeePerGas,
      ...(parsedGas !== null && { gas: parsedGas })
    }
  }
}
