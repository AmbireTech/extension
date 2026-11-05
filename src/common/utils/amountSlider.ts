import { formatUnits } from 'ethers'

// The step is the smallest 1-2-5 multiple of a power of ten that leaves at most this many amounts
// along the track - fine enough to pick an approximate amount, coarse enough to stay round.
const MAX_SLIDER_POSITIONS = 100n
const NICE_STEP_MULTIPLIERS = [1n, 2n, 5n]

/**
 * The "nice" step a slider over `maximumValue` moves in: 1, 2 or 5 times a power of ten, in the
 * unit's smallest denomination. Because the unit's decimals are a power of ten too, the step reads
 * as round in whole units as well (e.g. $10, 0.0005 ETH). A range too small to split into
 * `MAX_SLIDER_POSITIONS` moves by the smallest denomination itself (e.g. by 1 cent below $1).
 */
export const getNiceSliderStep = (maximumValue: bigint) => {
  const minimumStep = (maximumValue + MAX_SLIDER_POSITIONS - 1n) / MAX_SLIDER_POSITIONS
  if (minimumStep <= 1n) return 1n

  const magnitude = 10n ** BigInt(minimumStep.toString().length - 1)
  const multiplier = NICE_STEP_MULTIPLIERS.find(
    (niceMultiplier) => niceMultiplier * magnitude >= minimumStep
  )

  return multiplier ? multiplier * magnitude : 10n * magnitude
}

/**
 * Rounds a slider amount to the nearest multiple of its nice step (see `getNiceSliderStep`), so a
 * drag picks amounts like $20 or 0.05 ETH instead of $11.12 or 0.01137 ETH. Zero and the maximum
 * stay exact. An amount that would round past the maximum stays on the last step below it instead,
 * so a drag that stops just short of the end doesn't pick the whole balance.
 */
export const snapSliderAmount = (amount: bigint, maximumValue: bigint) => {
  if (amount <= 0n) return 0n
  if (amount >= maximumValue) return maximumValue

  const step = getNiceSliderStep(maximumValue)
  const snappedAmount = ((amount + step / 2n) / step) * step

  return snappedAmount <= maximumValue ? snappedAmount : maximumValue - (maximumValue % step)
}

/**
 * The amount the amount slider writes into the field. The slider already rounds what it emits (see
 * `snapSliderAmount`), and the amounts it doesn't round - the maximum and the caller's own marks -
 * have to stay exact, so this only formats the amount.
 */
export const getSliderAmountFieldValue = (amount: bigint, decimals: number) => {
  const formattedAmount = formatUnits(amount, decimals)

  // formatUnits always keeps a decimal, which reads as noise on a whole amount ("413.0")
  return formattedAmount.endsWith('.0') ? formattedAmount.slice(0, -2) : formattedAmount
}
