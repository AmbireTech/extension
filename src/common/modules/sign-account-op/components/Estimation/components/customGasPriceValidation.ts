import { parseUnits } from 'ethers'

import { FeeSpeed, SpeedCalc } from '@ambire-common/interfaces/signAccountOp'

/** The gas values that the user can set manually in the advanced gas options. */
export type CustomGasPriceField = 'maxFeePerGas' | 'maxPriorityFeePerGas' | 'gas'

/**
 * Why a custom gas value is not valid:
 * - `invalid` - the value is empty, is not a number, or is not greater than 0
 * - `tooManyDecimals` - the fee has more decimals than gwei allows (the smallest unit is 1 wei)
 * - `aboveMaxFee` - the max priority fee is higher than the max fee per gas
 * - `belowSpeedUpMinimum` - when speeding up a transaction, the fee is lower than the minimum
 *   the network needs to accept the replacement (see `speedUpMinFees`)
 */
export type CustomGasPriceErrorReason =
  | 'invalid'
  | 'tooManyDecimals'
  | 'aboveMaxFee'
  | 'belowSpeedUpMinimum'

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
  /** When speeding up a transaction, the lowest fees (in wei) the network accepts as a replacement */
  speedUpMinFees?: { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint }
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
  canSetCustomGas,
  speedUpMinFees
}: CustomGasPriceInput): { errors: CustomGasPriceErrors; values: CustomGasPriceValues | null } => {
  const errors: CustomGasPriceErrors = {}

  const normalizedMaxFeePerGas = normalizeCustomGasValue(maxFeePerGas)
  const parsedMaxFeePerGas = parsePositiveGwei(normalizedMaxFeePerGas)
  if (parsedMaxFeePerGas === null) {
    errors.maxFeePerGas = getGweiErrorReason(normalizedMaxFeePerGas)
  } else if (speedUpMinFees && parsedMaxFeePerGas < speedUpMinFees.maxFeePerGas) {
    errors.maxFeePerGas = 'belowSpeedUpMinimum'
  }

  const normalizedMaxPriorityFeePerGas = normalizeCustomGasValue(maxPriorityFeePerGas)
  const parsedMaxPriorityFeePerGas = is1559 ? parsePositiveGwei(normalizedMaxPriorityFeePerGas) : 0n
  if (parsedMaxPriorityFeePerGas === null) {
    errors.maxPriorityFeePerGas = getGweiErrorReason(normalizedMaxPriorityFeePerGas)
  } else if (parsedMaxFeePerGas !== null && parsedMaxPriorityFeePerGas > parsedMaxFeePerGas) {
    errors.maxPriorityFeePerGas = 'aboveMaxFee'
  } else if (
    is1559 &&
    speedUpMinFees &&
    parsedMaxPriorityFeePerGas < speedUpMinFees.maxPriorityFeePerGas
  ) {
    errors.maxPriorityFeePerGas = 'belowSpeedUpMinimum'
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

/**
 * Why a valid custom gas value may still be a bad idea:
 * - `belowSlowest` - lower than the slow speed, so the transaction can be stuck
 * - `farAboveFastest` - more than `OVERPAY_WARNING_MULTIPLIER` times the ape speed, so the user overpays
 * - `belowEstimatedGas` - the gas limit is lower than the estimate, so the transaction can fail
 */
export type CustomGasPriceWarningReason = 'belowSlowest' | 'farAboveFastest' | 'belowEstimatedGas'

/** The warnings, one per field, so that each input shows only its own warning. */
export type CustomGasPriceWarnings = Partial<
  Record<CustomGasPriceField, CustomGasPriceWarningReason>
>

/** How many times the fastest network fee a custom fee can be before the user is warned of overpaying. */
export const OVERPAY_WARNING_MULTIPLIER = 2n

/**
 * Compares valid custom gas values with the network fee speeds. Returns no warnings
 * when the slow or the ape speed is missing, as there is nothing to compare with.
 */
export const getCustomGasPriceWarnings = ({
  values,
  networkSpeeds,
  is1559
}: {
  values: CustomGasPriceValues
  /** The fee speeds at the network gas prices, not at the custom ones */
  networkSpeeds: SpeedCalc[]
  is1559: boolean
}): CustomGasPriceWarnings => {
  const slowSpeed = networkSpeeds.find(({ type }) => type === FeeSpeed.Slow)
  const apeSpeed = networkSpeeds.find(({ type }) => type === FeeSpeed.Ape)
  if (!slowSpeed || !apeSpeed) return {}

  const warnings: CustomGasPriceWarnings = {}

  if (values.maxFeePerGas < slowSpeed.gasPrice) {
    warnings.maxFeePerGas = 'belowSlowest'
  } else if (!is1559 && values.maxFeePerGas > apeSpeed.gasPrice * OVERPAY_WARNING_MULTIPLIER) {
    // With EIP-1559 only the priority fee is paid in full, so a high max fee alone costs nothing
    warnings.maxFeePerGas = 'farAboveFastest'
  }

  // Undefined when the network asks for no priority fee at all
  const { maxPriorityFeePerGas: slowPriorityFee } = slowSpeed
  const { maxPriorityFeePerGas: apePriorityFee } = apeSpeed
  if (is1559 && slowPriorityFee !== undefined && values.maxPriorityFeePerGas < slowPriorityFee) {
    warnings.maxPriorityFeePerGas = 'belowSlowest'
  } else if (
    is1559 &&
    apePriorityFee !== undefined &&
    values.maxPriorityFeePerGas > apePriorityFee * OVERPAY_WARNING_MULTIPLIER
  ) {
    warnings.maxPriorityFeePerGas = 'farAboveFastest'
  }

  if (values.gas !== undefined && values.gas < slowSpeed.simulatedGasLimit) {
    warnings.gas = 'belowEstimatedGas'
  }

  return warnings
}
