import { formatUnits } from 'ethers'

const SLIDER_AMOUNT_DECIMALS = 2
// The cut may never be coarser than this share of the range, or a small balance (e.g. 0.0372)
// leaves the drag only a few reachable amounts and the thumb jumps between them.
const MAX_CUT_SHARE_OF_RANGE = 1000n

/**
 * The amount the amount slider writes into the field, cut down to 2 decimals so a drag doesn't
 * fill it with up to 18 digits of noise - or to more decimals on a balance too small for 2 to
 * slide smoothly. The maximum stays exact, so the whole balance can still be picked, and so does
 * an amount the cut would wipe out entirely.
 */
export const getSliderAmountFieldValue = (
  amount: bigint,
  maximumValue: bigint,
  decimals: number
) => {
  let smallestKeptUnit = 10n ** BigInt(Math.max(decimals - SLIDER_AMOUNT_DECIMALS, 0))
  while (smallestKeptUnit > 1n && smallestKeptUnit * MAX_CUT_SHARE_OF_RANGE > maximumValue) {
    smallestKeptUnit /= 10n
  }
  const truncatedAmount = amount - (amount % smallestKeptUnit)
  const fieldAmount = amount >= maximumValue || truncatedAmount <= 0n ? amount : truncatedAmount
  const formattedAmount = formatUnits(fieldAmount, decimals)

  // formatUnits always keeps a decimal, which reads as noise on a whole amount ("413.0")
  return formattedAmount.endsWith('.0') ? formattedAmount.slice(0, -2) : formattedAmount
}
