export const SLIDER_STEPS = 10000n
// The marks a caller that passes none of its own gets: the slider divided into quarters, each
// marked by a dot the drag snaps onto, so round 0/25/50/75/100% amounts are reachable without
// having to land on them pixel by pixel.
const QUARTERS = [0n, 1n, 2n, 3n, 4n]
const QUARTER_COUNT = 4n

export interface Mark {
  /** The absolute amount, on the same axis as `tierOffset`, at which the dot sits. */
  value: bigint
  /** Optional tooltip shown on the dot. */
  tooltipContent?: string
  tooltipId?: string
}

/**
 * Every dot on the slider's track: its key, the amount it snaps to (relative to `tierOffset`) and
 * where it sits, in slider steps out of `SLIDER_STEPS`. Without `marks`, the quarters.
 */
export const getSliderMarks = ({
  marks,
  maximumValue,
  tierOffset
}: {
  marks?: Mark[]
  maximumValue: bigint
  tierOffset: bigint
}) => {
  if (!marks)
    return QUARTERS.map((quarter) => ({
      // Keyed and placed by the quarter, not the amount: on a zero or tiny maximum several
      // quarters share one, which stacked the dots at the start and duplicated their keys
      key: `quarter-${quarter}`,
      amount: (maximumValue * quarter) / QUARTER_COUNT,
      steps: (SLIDER_STEPS * quarter) / QUARTER_COUNT,
      tooltipContent: undefined,
      tooltipId: undefined
    }))

  return marks
    .map(({ value: markValue, tooltipContent, tooltipId }) => ({
      amount: markValue - tierOffset,
      tooltipContent,
      tooltipId
    }))
    .filter(({ amount }) => amount >= 0n && amount <= maximumValue)
    .map((mark) => ({
      ...mark,
      key: mark.tooltipId || `${mark.amount}`,
      steps: maximumValue > 0n ? (mark.amount * SLIDER_STEPS) / maximumValue : 0n
    }))
}
