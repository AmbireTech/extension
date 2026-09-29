import React, { useCallback, useMemo, useState } from 'react'
import { ColorValue, Pressable, StyleSheet, View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'

import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import Text from '@common/components/Text'
import { isMobile } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import { Portal } from '@gorhom/portal'

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
// Fixed rather than shrink-to-fit width for the mobile tap bubble - see the comment at its
// render site for why an unconstrained absolute-positioned width doesn't work here.
const BUBBLE_WIDTH = 140

// There's no hover on touch devices, so mobile toggles the same content in a small bubble on
// tap instead of relying on the (web-only) dataSet/pointer-based GlobalTooltip - styled like
// the real Tooltip (Tooltip.web.tsx) rather than the shared GlobalTooltip's bottom sheet,
// which reads as a heavier "info modal" than this ring warrants. It's a separate component so
// that an open bubble goes away with it when the ring drops back to its plain, non-pressable
// form (every segment at 0), instead of popping back up on its own once a segment is non-zero
// again.
const RingWithTapBubble = ({
  children,
  segmentShares,
  size
}: {
  children: React.ReactNode
  segmentShares: { key: string; text: string }[]
  size: number
}) => {
  const { theme } = useTheme()
  const [isBubbleOpen, setIsBubbleOpen] = useState(false)
  const handlePress = useCallback(() => setIsBubbleOpen((prev) => !prev), [])
  const handleCloseBubble = useCallback(() => setIsBubbleOpen(false), [])

  return (
    <Pressable onPress={handlePress}>
      <View style={{ position: 'relative' }}>
        {children}
        {isBubbleOpen && (
          <>
            {/* A tap anywhere else dismisses the bubble. The catcher lives in the root portal
            so it covers the whole screen no matter how deeply nested the ring is - it paints
            above the bubble, so any tap (the bubble included) closes it. */}
            <Portal hostName="global">
              <Pressable onPress={handleCloseBubble} style={StyleSheet.absoluteFill} />
            </Portal>
            {/* Small diamond acting as the tooltip's pointer arrow, pointing up at the ring.
            A fixed size (rather than shrink-to-fit) sidesteps a Yoga quirk where an
            absolutely positioned box with unresolved width collapses its stretched
            children down to a sliver instead of sizing to content. */}
            <View
              style={{
                position: 'absolute',
                top: size + 3,
                right: size / 2 - 5,
                width: 10,
                height: 10,
                backgroundColor: theme.tertiaryBackground,
                borderColor: theme.secondaryBorder,
                borderTopWidth: 1,
                borderLeftWidth: 1,
                transform: [{ rotate: '45deg' }],
                zIndex: 1
              }}
            />
            <View
              style={[
                spacings.phSm,
                spacings.pvTy,
                {
                  position: 'absolute',
                  top: size + 8,
                  // Anchored to the ring's right edge so the bubble grows leftwards - it's
                  // wider than the ring and would otherwise run off the right of the screen.
                  right: 0,
                  width: BUBBLE_WIDTH,
                  borderRadius: BORDER_RADIUS_PRIMARY,
                  borderWidth: 1,
                  borderColor: theme.secondaryBorder,
                  backgroundColor: theme.tertiaryBackground,
                  shadowColor: theme.shadowPrimary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 1,
                  shadowRadius: 8,
                  elevation: 8,
                  zIndex: 1
                }
              ]}
            >
              {segmentShares.map(({ key, text }) => (
                <Text key={key} fontSize={12} appearance="secondaryText">
                  {text}
                </Text>
              ))}
            </View>
          </>
        )}
      </View>
    </Pressable>
  )
}

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
  const visibleSegments = useMemo(
    () =>
      segments
        .filter((segment) => segment.valueUsd > 0)
        .sort((a, b) => getSegmentOrder(a.key) - getSegmentOrder(b.key)),
    [segments]
  )
  // Every non-zero segment's share, formatted once and shared by the web tooltip and the mobile
  // tap bubble - segments at 0% are omitted since they have no arc to explain.
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

  if (isMobile && tooltipContent) {
    return (
      <RingWithTapBubble segmentShares={segmentShares} size={size}>
        {ring}
      </RingWithTapBubble>
    )
  }

  return ring
}

export default React.memo(BalanceRatioProgress)
