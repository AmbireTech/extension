import React, { useMemo } from 'react'
import { ColorValue, View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'

import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import useTheme from '@common/hooks/useTheme'

export interface BalanceRatioSegment {
  key: string
  label: string
  valueUsd: number
  color: ColorValue
}

interface Props {
  segments: BalanceRatioSegment[]
  size?: number
  strokeWidth?: number
  testID?: string
}

// A fixed drawing order, independent of `segments`' own order: $WALLET leads at 12 o'clock,
// stkWALLET (or anything else) follows, and xWALLET always trails since it's not part of the
// stake/unstake flow's WALLET <-> stkWALLET split.
const getSegmentOrder = (key: string) => {
  if (key === 'wallet') return 0
  if (key === 'xWallet') return 2
  return 1
}

const TOOLTIP_ID = 'wallet-staking-balance-ratio'
// Visible space (in px, along the circumference) left between adjacent segments, on top of
// whatever the round line caps below already round off. A round cap extends strokeWidth / 2 past
// each end of its dash, so without this padding two caps facing each other across a thin gap
// would touch (or overlap) well before the gap looks empty.
const MIN_VISIBLE_SEGMENT_GAP = 1

// A small multi-segment donut ring next to the amount input, showing how the WALLET, stkWALLET
// and xWALLET balances split by USD value. `segments` are expected to already reflect the
// entered amount (moved from the source token to the destination token for the active mode), so
// the ring updates live as the user types - empty input shows the current on-chain split.
const BalanceRatioProgress = ({ segments, size = 28, strokeWidth = 4, testID }: Props) => {
  const { theme } = useTheme()
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const segmentGap = strokeWidth + MIN_VISIBLE_SEGMENT_GAP
  const totalUsd = useMemo(
    () => segments.reduce((sum, segment) => sum + Math.max(0, segment.valueUsd), 0),
    [segments]
  )
  const arcs = useMemo(() => {
    if (totalUsd <= 0) return []

    const visibleSegments = segments
      .filter((segment) => segment.valueUsd > 0)
      .sort((a, b) => getSegmentOrder(a.key) - getSegmentOrder(b.key))
    const tooltipContent = (segment: BalanceRatioSegment) =>
      `${segment.label}: ${Math.round((segment.valueUsd / totalUsd) * 100)}%`

    // A single filled segment has nothing to be separated from, so it draws as a full,
    // gap-free ring instead of leaving an orphaned gap next to its own start.
    if (visibleSegments.length <= 1) {
      return visibleSegments.map((segment) => ({
        key: segment.key,
        color: segment.color,
        segmentLength: circumference,
        dashoffset: 0,
        tooltipContent: tooltipContent(segment)
      }))
    }

    const drawableCircumference = Math.max(circumference - visibleSegments.length * segmentGap, 0)
    let accumulatedLength = 0
    return visibleSegments.map((segment) => {
      const segmentLength = (segment.valueUsd / totalUsd) * drawableCircumference
      const dashoffset = -accumulatedLength
      accumulatedLength += segmentLength + segmentGap

      return {
        key: segment.key,
        color: segment.color,
        segmentLength,
        dashoffset,
        tooltipContent: tooltipContent(segment)
      }
    })
  }, [circumference, segmentGap, segments, totalUsd])

  return (
    <View testID={testID}>
      {/* Rotated so the first arc starts at 12 o'clock instead of the SVG default of 3 o'clock */}
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.primaryBorder}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {arcs.map(({ key, color, segmentLength, dashoffset, tooltipContent }) => (
          <Circle
            key={key}
            // Each arc gets its own hover tooltip (rather than one combined tooltip for the whole
            // ring) - dataSet flows straight through react-native-svg's web shape to a real
            // `data-tooltip` DOM attribute, same as it does on a plain View, but react-native-svg
            // doesn't type it on CircleProps - cast at this one trusted, runtime-verified spot.
            {...({
              dataSet: createGlobalTooltipDataSet({
                id: `${TOOLTIP_ID}-${key}`,
                content: tooltipContent
              })
            } as any)}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
            strokeDashoffset={dashoffset}
            strokeLinecap="round"
            fill="none"
          />
        ))}
      </Svg>
    </View>
  )
}

export default React.memo(BalanceRatioProgress)
