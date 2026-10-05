import { formatUnits, parseUnits } from 'ethers'

import { CONVERSION_PRECISION, CONVERSION_PRECISION_POW } from '@ambire-common/consts/swapAndBridge'
import { getSanitizedAmount } from '@ambire-common/libs/transfer/amount'
import {
  convertTokenPriceToBigInt,
  getSafeAmountFromFieldValue,
  safeTokenAmountAndNumberMultiplication
} from '@ambire-common/utils/numbers/formatters'

// Precision of a typed USD amount before conversion
const FIAT_DECIMALS = 10

type AmountFieldMode = 'token' | 'fiat'

/**
 * Token and USD amounts of a Send amount field, typed in either. Same conversion as
 * `TransferController`. With no price, the input is the token amount and there is no USD value.
 */
const getAmountsFromFieldValue = ({
  fieldValue,
  fieldMode,
  price,
  decimals
}: {
  fieldValue: string
  fieldMode: AmountFieldMode
  price: number | null
  decimals: number
}): { amount: string; amountInFiat: string } => {
  if (!fieldValue) return { amount: '', amountInFiat: '' }
  if (!price) return { amount: fieldValue, amountInFiat: '' }

  if (fieldMode === 'fiat') {
    const { tokenPriceBigInt, tokenPriceDecimals } = convertTokenPriceToBigInt(price)
    const sanitizedFiat = getSanitizedAmount(fieldValue, FIAT_DECIMALS)
    const fiatAmount = sanitizedFiat ? parseUnits(sanitizedFiat, FIAT_DECIMALS) : 0n

    return {
      // Cut to the token's decimals
      amount: getSanitizedAmount(
        formatUnits(
          (fiatAmount * CONVERSION_PRECISION_POW) / tokenPriceBigInt,
          // Shift the decimal point by the number of decimals in the token price
          FIAT_DECIMALS + CONVERSION_PRECISION - tokenPriceDecimals
        ),
        decimals
      ),
      amountInFiat: fieldValue
    }
  }

  try {
    return {
      amount: fieldValue,
      amountInFiat: safeTokenAmountAndNumberMultiplication(
        parseUnits(getSafeAmountFromFieldValue(fieldValue, decimals), decimals),
        decimals,
        price
      )
    }
  } catch {
    // Not a number yet (the form rejects it too)
    return { amount: fieldValue, amountInFiat: '' }
  }
}

export type { AmountFieldMode }
export { getAmountsFromFieldValue }
