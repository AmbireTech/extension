import { formatUnits, parseUnits } from 'ethers'

import { CONVERSION_PRECISION, CONVERSION_PRECISION_POW } from '@ambire-common/consts/swapAndBridge'
import { getSanitizedAmount } from '@ambire-common/libs/transfer/amount'
import {
  convertTokenPriceToBigInt,
  getSafeAmountFromFieldValue,
  safeTokenAmountAndNumberMultiplication
} from '@ambire-common/utils/numbers/formatters'

// How precisely a typed USD amount is taken, before it is converted to the token
const FIAT_DECIMALS = 10

type AmountFieldMode = 'token' | 'fiat'

/**
 * Both sides of what is typed in a Send amount field - the token amount and its USD value -
 * whichever of the two it is typed in. The same conversion the regular Send does in
 * `TransferController`, so the two forms agree on what an amount is worth.
 *
 * With no price, what is typed is the token amount and there is no USD value.
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
      // Cut to the token's decimals, since a USD figure rarely divides into it evenly
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
    // An entry that is not a number yet has no USD value; the form does not accept it either
    return { amount: fieldValue, amountInFiat: '' }
  }
}

export type { AmountFieldMode }
export { getAmountsFromFieldValue }
