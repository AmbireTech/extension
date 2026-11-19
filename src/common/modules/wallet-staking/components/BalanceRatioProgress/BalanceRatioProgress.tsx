import React, { useMemo } from 'react'
import { ColorValue, Pressable, View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'

import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import useShowTooltipAtPress from '@common/components/Tooltip/useShowTooltipAtPress'
import { isMobile } from '@common/config/env'
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
  const showTooltipAtPress = useShowTooltipAtPress()
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const segmentGap = strokeWidth + MIN_VISIBLE_SEGMENT_GAP
  const totalUsd = useMemo(
    () => segments.reduce((sum, segment) => sum + Math.max(0, segment.valueUsd), 0),
    [segments]
  )
  const visibleSegments = useMemo(
    () =>
      segments
        .filter((segment) => segment.valueUsd > 0)
        .sort((a, b) => getSegmentOrder(a.key) - getSegmentOrder(b.key)),
    [segments]
  )
  // Every non-zero segment's share - segments at 0% are omitted since they have no arc to explain.
  const segmentShares = useMemo(
    () =>
      totalUsd > 0
        ? visibleSegments.map((segment) => {
            const sharePercent = Math.round((segment.valueUsd / totalUsd) * 100)

            // A segment only makes the list when it holds something, so dust reads as "<1%"
            // rather than the "0%" it rounds down to, which would contradict its own arc.
            return {
              key: segment.key,
              text: `${segment.label}: ${sharePercent < 1 ? '<1' : sharePercent}%`
            }
          })
        : [],
    [totalUsd, visibleSegments]
  )
  // One combined tooltip for the whole ring, listing every non-zero segment's share.
  const tooltipContent = useMemo(
    () => segmentShares.map(({ text }) => text).join('\n'),
    [segmentShares]
  )
  const arcs = useMemo(() => {
    if (totalUsd <= 0) return []

    // A single filled segment has nothing to be separated from, so it draws as a full,
    // gap-free ring instead of leaving an orphaned gap next to its own start.
    if (visibleSegments.length <= 1) {
      return visibleSegments.map((segment) => ({
        key: segment.key,
        color: segment.color,
        segmentLength: circumference,
        dashoffset: 0
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
        dashoffset
      }
    })
  }, [circumference, segmentGap, totalUsd, visibleSegments])

  const ring = (
    <View
      testID={testID}
      // One combined tooltip for the whole ring rather than one per arc, listing every
      // non-zero segment's share.
      dataSet={
        tooltipContent
          ? createGlobalTooltipDataSet({
              id: TOOLTIP_ID,
              content: tooltipContent,
              style: { whiteSpace: 'pre-line' }
            })
          : undefined
      }
    >
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
        {arcs.map(({ key, color, segmentLength, dashoffset }) => (
          <Circle
            key={key}
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

  // There's no hover on touch devices, so on mobile a tap opens the same content in the shared
  // tooltip. The ring itself takes the touch, as the rotated Svg would throw off its position
  if (isMobile && tooltipContent) {
    return (
      <Pressable
        onPress={(event) =>
          showTooltipAtPress(
            event,
            { id: TOOLTIP_ID, content: tooltipContent },
            { width: size, height: size }
          )
        }
      >
        <View pointerEvents="box-only">{ring}</View>
      </Pressable>
    )
  }

  return ring
}

export default React.memo(BalanceRatioProgress)
