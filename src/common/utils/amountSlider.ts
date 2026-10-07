import { formatUnits } from 'ethers'

const SLIDER_AMOUNT_DECIMALS = 2

/**
 * The amount the amount slider writes into the field, cut down to 2 decimals so a drag doesn't
 * fill it with up to 18 digits of noise. The maximum stays exact, so the whole balance can still
 * be picked, and so does an amount the cut would wipe out entirely, e.g. on a tiny balance.
 */
export const getSliderAmountFieldValue = (
  amount: bigint,
  maximumValue: bigint,
  decimals: number
) => {
  const smallestKeptUnit = 10n ** BigInt(Math.max(decimals - SLIDER_AMOUNT_DECIMALS, 0))
  const truncatedAmount = amount - (amount % smallestKeptUnit)
  const fieldAmount = amount >= maximumValue || truncatedAmount <= 0n ? amount : truncatedAmount
  const formattedAmount = formatUnits(fieldAmount, decimals)

  // formatUnits always keeps a decimal, which reads as noise on a whole amount ("413.0")
  return formattedAmount.endsWith('.0') ? formattedAmount.slice(0, -2) : formattedAmount
}
