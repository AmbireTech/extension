import React, { useCallback, useMemo, useState } from 'react'
import {
  AccessibilityActionEvent,
  GestureResponderEvent,
  LayoutChangeEvent,
  View
} from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'

import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import HoverablePressable from '@common/components/HoverablePressable'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import { ACCENT_PRIMITIVES } from '@common/styles/theme/primitives'
import { THEME_TYPES } from '@common/styles/theme/types'

import getStyles from './styles'

const THUMB_SIZE = 20
const SLIDER_STEPS = 10000n
const ACCESSIBILITY_STEP = SLIDER_STEPS / 20n
const ACCESSIBILITY_ACTIONS = [{ name: 'increment' }, { name: 'decrement' }] as const
// How close (in px, from either side) the pointer needs to be to a threshold tick, or to either
// end of the track, for the value to magnetically snap onto it instead of the raw pointer
// position. The track ends are checked first (see updateValue), so a threshold that happens to
// sit within the radius of an end loses to that end.
const SNAP_RADIUS = 8
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

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width)
  }, [])

  const updateValue = useCallback(
    (locationX: number) => {
      if (!availableWidth || maximumValue <= 0n) return

      const position = Math.min(Math.max(locationX - THUMB_SIZE / 2, 0), availableWidth)

      // Magnetic snap to the track's own ends takes priority over snapping to a threshold -
      // checked first so an end wins whenever a threshold happens to sit within the radius of it.
      if (position <= SNAP_RADIUS) {
        onValueChange(0n)
        return
      }
      if (position >= availableWidth - SNAP_RADIUS) {
        onValueChange(maximumValue)
        return
      }

      // Magnetic snap: land exactly on a threshold's own value (not just its nearest slider
      // step) whenever the pointer is close to its tick mark, from either side.
      const nearestThreshold = thresholdMarkers.find(
        (threshold) => Math.abs(threshold.position - position) <= SNAP_RADIUS
      )
      if (nearestThreshold) {
        onValueChange(nearestThreshold.value - tierOffset)
        return
      }

      const nextStep = BigInt(Math.round((position / availableWidth) * Number(SLIDER_STEPS)))
      onValueChange((maximumValue * nextStep) / SLIDER_STEPS)
    },
    [availableWidth, maximumValue, onValueChange, thresholdMarkers, tierOffset]
  )

  const handlePress = useCallback(
    (event: GestureResponderEvent) => updateValue(event.nativeEvent.locationX),
    [updateValue]
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
        .onBegin(({ x }) => updateValue(x))
        .onUpdate(({ x }) => updateValue(x)),
    [maximumValue, updateValue]
  )
  const handleAccessibilityAction = useCallback(
    (event: AccessibilityActionEvent) => {
      const direction = event.nativeEvent.actionName === 'increment' ? 1n : -1n
      const nextStep = sliderStep + ACCESSIBILITY_STEP * direction
      const clampedStep = nextStep < 0n ? 0n : nextStep > SLIDER_STEPS ? SLIDER_STEPS : nextStep
      onValueChange((maximumValue * clampedStep) / SLIDER_STEPS)
    },
    [maximumValue, onValueChange, sliderStep]
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
    <View>
      <GestureDetector gesture={panGesture}>
        <HoverablePressable
          accessible
          accessibilityActions={ACCESSIBILITY_ACTIONS}
          accessibilityLabel={accessibilityLabel || t('$WALLET amount')}
          accessibilityRole="adjustable"
          accessibilityValue={accessibilityValue}
          onAccessibilityAction={handleAccessibilityAction}
          onLayout={handleLayout}
          onPress={handlePress}
          style={styles.amountSlider}
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
          <View style={[styles.amountSliderThumb, { left: thumbPosition }]} />
        </HoverablePressable>
      </GestureDetector>
    </View>
  )
}

export default React.memo(AmountSlider)
