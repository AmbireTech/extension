import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { AccessibilityActionEvent, LayoutChangeEvent, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'

import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import HoverablePressable from '@common/components/HoverablePressable'
import Text from '@common/components/Text'
import { captureException } from '@common/config/analytics/CrashAnalytics'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import { ACCENT_PRIMITIVES } from '@common/styles/theme/primitives'
import { THEME_TYPES } from '@common/styles/theme/types'

import getStyles from './styles'

const THUMB_SIZE = 20
// Matches the track's height (and so its corner radius), so the first and last dot fill the
// track's rounded caps exactly - see the edge alignment in quarterMarkers.
const QUARTER_DOT_SIZE = 8
const SLIDER_STEPS = 10000n
const ACCESSIBILITY_STEP = SLIDER_STEPS / 20n
const ACCESSIBILITY_ACTIONS = [{ name: 'increment' }, { name: 'decrement' }] as const
// How close (in px, from either side) the pointer needs to be, while dragging, to a quarter dot,
// a threshold tick or either end of the track, for the value to magnetically snap onto it instead
// of the raw pointer position. The track ends are checked first (see updateValue), so a mark that happens to
// sit within the radius of an end loses to that end.
const SNAP_RADIUS = 8
// A press is a deliberate "give me that mark" rather than a fine adjustment, so it snaps from
// much further out than a drag does - tapping near a dot should land on it, not a few percent off.
const PRESS_SNAP_RADIUS = 24
// The slider is also divided into quarters, each marked by a dot the drag snaps onto, so round
// 0/25/50/75/100% amounts are reachable without having to land on them pixel by pixel.
const QUARTERS = [0n, 1n, 2n, 3n, 4n]
const QUARTER_COUNT = 4n
// The bubble showing the picked percentage while the slider is being used, and how long it stays
// up after the finger leaves it.
const VALUE_BUBBLE_WIDTH = 48
const VALUE_BUBBLE_LINGER = 700
const parseHexChannels = (hex: string) => {
  const cleanHex = hex.replace('#', '')
  return [
    parseInt(cleanHex.substring(0, 2), 16),
    parseInt(cleanHex.substring(2, 4), 16),
    parseInt(cleanHex.substring(4, 6), 16)
  ] as const
}

// A hex color partway between fromHex and toHex. Always takes literal hex as input, never a
// previously mixed value, so there's no risk of an already-mixed value being misparsed as raw hex.
const mixHex = (fromHex: string, toHex: string, amount: number) => {
  const [fromRed, fromGreen, fromBlue] = parseHexChannels(fromHex)
  const [toRed, toGreen, toBlue] = parseHexChannels(toHex)
  const toHexChannel = (value: number) => Math.round(value).toString(16).padStart(2, '0')
  const mixChannel = (from: number, to: number) => toHexChannel(from + (to - from) * amount)

  return `#${mixChannel(fromRed, toRed)}${mixChannel(fromGreen, toGreen)}${mixChannel(fromBlue, toBlue)}`
}

// The two ends of the fee-tier gradient below - light purple (least staked) to Ambire's primary
// brand purple, primaryAccent300 (most staked) - pushed a bit past the raw theme constants
// (lighter start, deeper end) for more visible variation between tiers. Fixed rather than
// theme-resolved, so they always stay valid, opaque colors regardless of the active theme.
const GRADIENT_START_HEX = mixHex(
  ACCENT_PRIMITIVES.primaryAccent200[THEME_TYPES.DARK],
  '#FFFFFF',
  0.35
)
const GRADIENT_END_HEX = mixHex(
  ACCENT_PRIMITIVES.primaryAccent300[THEME_TYPES.LIGHT],
  '#000000',
  0.28
)

// Evenly spaced hex colors between (and including) the two endpoints above.
const buildGradient = (fromHex: string, toHex: string, steps: number) =>
  Array.from({ length: steps }, (_, index) =>
    mixHex(fromHex, toHex, steps > 1 ? index / (steps - 1) : 0)
  )

// One color per fee tier, plus one more for the very start (5 for the 4 tiers in
// SWAP_AND_BRIDGE_FEE_TIERS), from light purple to Ambire's primary brand purple.
const PROGRESS_TIER_COLORS = buildGradient(GRADIENT_START_HEX, GRADIENT_END_HEX, 5)

interface Threshold {
  /** The absolute stkWALLET amount, on the same axis as the active (draggable) range, at which
   * the marker sits. */
  value: bigint
  /** Optional label rendered under the tick, e.g. a tooltip trigger. */
  tooltipContent?: string
  tooltipId?: string
}

interface Props {
  value: bigint
  maximumValue: bigint
  onValueChange: (value: bigint) => void
  accessibilityLabel?: string
  /** The stkWALLET amount already held before this slider's draggable range even starts - e.g.
   * stkWALLET already staked (stake mode). Not shown on the track itself; it only shifts the fee
   * tier thresholds so they still land at the correct absolute stkWALLET amount rather than at
   * `threshold - alreadyStakedAmount`. Irrelevant (and left at 0) in unstake mode, since the
   * WALLET balance not being unstaked is a different token with no bearing on the fee tier. */
  tierOffset?: bigint
  /** Tick marks (e.g. Swap & Bridge fee thresholds) for the active (draggable) range - also used
   * to color it by tier. Values outside that range are ignored. */
  thresholds?: Threshold[]
}

const AmountSlider = ({
  value,
  maximumValue,
  onValueChange,
  accessibilityLabel,
  tierOffset = 0n,
  thresholds
}: Props) => {
  const { t } = useTranslation()
  const { styles, themeType } = useTheme(getStyles)
  // On a dark background a lighter fill reads as more prominent, so in dark mode the gradient
  // runs the other way - most staked ends up light purple instead of Ambire purple.
  const progressTierColors = useMemo(
    () =>
      themeType === THEME_TYPES.DARK ? [...PROGRESS_TIER_COLORS].reverse() : PROGRESS_TIER_COLORS,
    [themeType]
  )
  const [width, setWidth] = useState(0)
  const isDisabled = maximumValue <= 0n
  const availableWidth = Math.max(width - THUMB_SIZE, 0)
  const clampedValue = value < 0n ? 0n : value > maximumValue ? maximumValue : value
  const sliderStep = maximumValue > 0n ? (clampedValue * SLIDER_STEPS) / maximumValue : 0n
  const thumbPosition = Number(sliderStep) * (availableWidth / Number(SLIDER_STEPS))
  // Thresholds within the active (draggable) range only - a threshold beyond `maximumValue` away
  // from `tierOffset` isn't reachable by dragging, and one already covered by tierOffset alone
  // doesn't need a tick (see startTierIndex below, which colors the segment as if already past
  // it).
  const allBoundaries = useMemo(
    () =>
      (thresholds || [])
        .map(({ value: thresholdValue }) => thresholdValue)
        .filter(
          (thresholdValue) => thresholdValue > 0n && thresholdValue < tierOffset + maximumValue
        )
        .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
    [maximumValue, thresholds, tierOffset]
  )
  const startTierIndex = useMemo(
    () => allBoundaries.filter((thresholdValue) => thresholdValue <= tierOffset).length,
    [allBoundaries, tierOffset]
  )
  const tierBoundaries = useMemo(
    () => allBoundaries.filter((thresholdValue) => thresholdValue > tierOffset),
    [allBoundaries, tierOffset]
  )
  // Splits the filled part of the track (0..clampedValue) into one segment per fee tier it
  // spans, each rendered in a different shade - see PROGRESS_TIER_COLORS.
  const progressSegments = useMemo(() => {
    if (clampedValue <= 0n) return []

    const points = [tierOffset, ...tierBoundaries, tierOffset + maximumValue]
    const filledEnd = tierOffset + clampedValue
    const segments: { key: string; widthSteps: bigint }[] = []

    for (let i = 0; i < points.length - 1; i += 1) {
      const segmentStart = points[i] as bigint
      const nextPoint = points[i + 1] as bigint
      if (segmentStart >= filledEnd) break

      const segmentEnd = nextPoint < filledEnd ? nextPoint : filledEnd
      if (segmentEnd <= segmentStart) continue

      const startSteps = ((segmentStart - tierOffset) * SLIDER_STEPS) / clampedValue
      const endSteps = ((segmentEnd - tierOffset) * SLIDER_STEPS) / clampedValue
      segments.push({ key: `${segmentStart}`, widthSteps: endSteps - startSteps })
    }

    return segments
  }, [clampedValue, maximumValue, tierBoundaries, tierOffset])
  const progressWidth = Math.max(thumbPosition, 0)
  const thresholdMarkers = useMemo(
    () =>
      tierBoundaries.map((thresholdValue) => {
        const steps =
          maximumValue > 0n ? ((thresholdValue - tierOffset) * SLIDER_STEPS) / maximumValue : 0n
        const position = Number(steps) * (availableWidth / Number(SLIDER_STEPS))
        const matchingThreshold = (thresholds || []).find(({ value: v }) => v === thresholdValue)
        return { ...matchingThreshold, value: thresholdValue, position }
      }),
    [availableWidth, maximumValue, thresholds, tierBoundaries, tierOffset]
  )

  const quarterMarkers = useMemo(
    () =>
      QUARTERS.map((quarter, index) => {
        const position = (Number(quarter) / Number(QUARTER_COUNT)) * availableWidth
        // Every dot but the two ends is centered on its own position. Those two are pulled fully
        // inside the track instead, so they sit flush with its rounded caps rather than hanging
        // half a dot over each end.
        const edgeOffset =
          index === 0
            ? 1
            : index === QUARTERS.length - 1
              ? -QUARTER_DOT_SIZE + 1
              : -QUARTER_DOT_SIZE / 2

        return {
          key: `${quarter}`,
          amount: (maximumValue * quarter) / QUARTER_COUNT,
          position,
          left: THUMB_SIZE / 2 + position + edgeOffset
        }
      }),
    [availableWidth, maximumValue]
  )
  // Everything the drag magnetically snaps onto - the quarter dots and the fee thresholds - on
  // the same axis, so the nearest of the two always wins.
  const snapPoints = useMemo(
    () => [
      ...quarterMarkers,
      ...thresholdMarkers.map(({ value: thresholdValue, position }) => ({
        amount: thresholdValue - tierOffset,
        position
      }))
    ],
    [quarterMarkers, thresholdMarkers, tierOffset]
  )

  // Counts the touches the bubble has seen instead of tracking whether the slider is being used
  // right now - a quick tap begins and ends within the same render, so a plain "is being used"
  // flag would never flip back and the bubble would stay up forever. 0 means hidden.
  const [valueBubbleTouches, setValueBubbleTouches] = useState(0)
  const valueBubbleLeft = Math.min(
    Math.max(thumbPosition + THUMB_SIZE / 2 - VALUE_BUBBLE_WIDTH / 2, 0),
    Math.max(width - VALUE_BUBBLE_WIDTH, 0)
  )

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width: nextWidth } = event.nativeEvent.layout
    // A non-finite width would spread through every position below and end up in a style, which
    // native layout refuses outright.
    if (!Number.isFinite(nextWidth)) return

    setWidth(nextWidth)
  }, [])

  // The parent's handler runs inside a gesture callback, so anything it throws would escape with
  // nothing above it to catch it and take the app down mid-drag. Report it and keep the slider
  // usable instead.
  const emitValueChange = useCallback(
    (nextValue: bigint) => {
      try {
        onValueChange(nextValue)
      } catch (error) {
        console.error('Failed to apply the $WALLET staking slider value', error)
        captureException(error)
      }
    },
    [onValueChange]
  )

  // Every touch pushes the bubble's hiding back, so it stays up throughout a drag and lingers for
  // a moment after the finger leaves it, keeping the picked percentage readable.
  useEffect(() => {
    if (!valueBubbleTouches) return () => {}

    const hideTimeout = setTimeout(() => setValueBubbleTouches(0), VALUE_BUBBLE_LINGER)

    return () => clearTimeout(hideTimeout)
  }, [valueBubbleTouches])

  const updateValue = useCallback(
    (locationX: number, snapRadius: number) => {
      if (!availableWidth || maximumValue <= 0n) return
      // Guards every calculation below, but the BigInt conversion at the end above all - it
      // throws on anything that isn't a whole, finite number.
      if (!Number.isFinite(locationX)) return

      const position = Math.min(Math.max(locationX - THUMB_SIZE / 2, 0), availableWidth)

      // Magnetic snap to the track's own ends takes priority over snapping to a threshold -
      // checked first so an end wins whenever a threshold happens to sit within the radius of it.
      if (position <= snapRadius) {
        emitValueChange(0n)
        return
      }
      if (position >= availableWidth - snapRadius) {
        emitValueChange(maximumValue)
        return
      }

      // Magnetic snap: land exactly on a quarter's or a threshold's own value (not just its
      // nearest slider step) whenever the pointer is close to its mark, from either side.
      const nearestSnapPoint = snapPoints.reduce<(typeof snapPoints)[number] | null>(
        (nearest, snapPoint) => {
          const distance = Math.abs(snapPoint.position - position)
          if (distance > snapRadius) return nearest

          return !nearest || distance < Math.abs(nearest.position - position) ? snapPoint : nearest
        },
        null
      )
      if (nearestSnapPoint) {
        emitValueChange(nearestSnapPoint.amount)
        return
      }

      const rawStep = Math.round((position / availableWidth) * Number(SLIDER_STEPS))
      const nextStep = BigInt(Math.min(Math.max(rawStep, 0), Number(SLIDER_STEPS)))
      emitValueChange((maximumValue * nextStep) / SLIDER_STEPS)
    },
    [availableWidth, emitValueChange, maximumValue, snapPoints]
  )

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(maximumValue > 0n)
        .minDistance(0)
        // Only claims the gesture once the drag is clearly horizontal, so a vertical swipe that
        // starts on the slider (e.g. to scroll the now-scrollable screen) isn't swallowed by it.
        .activeOffsetX([-8, 8])
        .failOffsetY([-12, 12])
        .runOnJS(true)
        .onBegin(({ x }) => {
          setValueBubbleTouches((touches) => touches + 1)
          updateValue(x, PRESS_SNAP_RADIUS)
        })
        .onUpdate(({ x }) => {
          setValueBubbleTouches((touches) => touches + 1)
          updateValue(x, SNAP_RADIUS)
        }),
    [maximumValue, updateValue]
  )
  const handleAccessibilityAction = useCallback(
    (event: AccessibilityActionEvent) => {
      const direction = event.nativeEvent.actionName === 'increment' ? 1n : -1n
      const nextStep = sliderStep + ACCESSIBILITY_STEP * direction
      const clampedStep = nextStep < 0n ? 0n : nextStep > SLIDER_STEPS ? SLIDER_STEPS : nextStep
      emitValueChange((maximumValue * clampedStep) / SLIDER_STEPS)
    },
    [emitValueChange, maximumValue, sliderStep]
  )
  const accessibilityValue = useMemo(
    () => ({
      min: 0,
      max: 100,
      now: Number(sliderStep) / 100,
      text: `${Number(sliderStep) / 100}%`
    }),
    [sliderStep]
  )

  return (
    <View style={styles.amountSliderWrapper}>
      {!!valueBubbleTouches && (
        <View style={[styles.amountSliderValueBubble, { left: valueBubbleLeft }]}>
          <Text fontSize={12} weight="medium" appearance="primary">
            {`${Math.round(Number(sliderStep) / 100)}%`}
          </Text>
        </View>
      )}
      <GestureDetector gesture={panGesture}>
        <HoverablePressable
          accessible
          accessibilityActions={ACCESSIBILITY_ACTIONS}
          accessibilityLabel={accessibilityLabel || t('$WALLET amount')}
          accessibilityRole="adjustable"
          accessibilityValue={accessibilityValue}
          onAccessibilityAction={handleAccessibilityAction}
          onLayout={handleLayout}
          disabled={isDisabled}
          style={[styles.amountSlider, isDisabled && styles.amountSliderDisabled]}
        >
          <View style={styles.amountSliderTrack} />
          <View
            style={[
              styles.amountSliderProgressContainer,
              { left: THUMB_SIZE / 2, width: progressWidth }
            ]}
          >
            {progressSegments.map((segment, index) => (
              <View
                key={segment.key}
                style={{
                  width: Number(segment.widthSteps) * (progressWidth / Number(SLIDER_STEPS)),
                  height: '100%',
                  backgroundColor:
                    progressTierColors[
                      Math.min(startTierIndex + index, progressTierColors.length - 1)
                    ]
                }}
              />
            ))}
          </View>
          {quarterMarkers.map((quarter) => (
            <View key={quarter.key} style={[styles.amountSliderQuarter, { left: quarter.left }]} />
          ))}
          {thresholdMarkers.map((threshold) => (
            <View
              key={threshold.tooltipId || `${threshold.value}`}
              dataSet={
                threshold.tooltipContent && threshold.tooltipId
                  ? createGlobalTooltipDataSet({
                      id: threshold.tooltipId,
                      content: threshold.tooltipContent
                    })
                  : undefined
              }
              style={[styles.amountSliderThreshold, { left: THUMB_SIZE / 2 + threshold.position }]}
            />
          ))}
          <View style={[styles.amountSliderThumb, { left: thumbPosition }]}>
            <View style={styles.amountSliderThumbInner} />
          </View>
        </HoverablePressable>
      </GestureDetector>
    </View>
  )
}

export default React.memo(AmountSlider)
