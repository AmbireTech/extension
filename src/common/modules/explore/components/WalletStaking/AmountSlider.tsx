import React, { useCallback, useMemo, useState } from 'react'
import {
  AccessibilityActionEvent,
  GestureResponderEvent,
  LayoutChangeEvent,
  View,
  ViewStyle
} from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'

import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import HoverablePressable from '@common/components/HoverablePressable'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import { ACCENT_PRIMITIVES } from '@common/styles/theme/primitives'
import { THEME_TYPES } from '@common/styles/theme/types'
import { hexToRgba } from '@common/styles/utils/common'

import getStyles from './styles'

const THUMB_SIZE = 20
const SLIDER_STEPS = 10000n
const ACCESSIBILITY_STEP = SLIDER_STEPS / 20n
const ACCESSIBILITY_ACTIONS = [{ name: 'increment' }, { name: 'decrement' }] as const
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
  /** The absolute amount (staked + entered), on the same 0..maximumValue+stakedValue axis, at which the marker sits. */
  value: bigint
  /** Optional label rendered under the tick, e.g. a tooltip trigger. */
  tooltipContent?: string
  tooltipId?: string
}

interface Props {
  value: bigint
  maximumValue: bigint
  maximumLabel: string
  onValueChange: (value: bigint) => void
  accessibilityLabel?: string
  /** The amount already committed (e.g. current stkWALLET balance) - shown as a dark, unreachable
   * segment at the start of the track. The rest of the track represents `maximumValue`. */
  stakedValue?: bigint
  stakedLabel?: string
  /** Tick marks (e.g. Swap & Bridge fee thresholds), positioned along the whole
   * `stakedValue + maximumValue` axis. */
  thresholds?: Threshold[]
}

const AmountSlider = ({
  value,
  maximumValue,
  maximumLabel,
  onValueChange,
  accessibilityLabel,
  stakedValue = 0n,
  stakedLabel,
  thresholds
}: Props) => {
  const { t } = useTranslation()
  const { styles, theme, themeType } = useTheme(getStyles)
  // On a dark background a lighter fill reads as more prominent, so in dark mode the gradient
  // runs the other way - most staked ends up light purple instead of Ambire purple.
  const progressTierColors = useMemo(
    () =>
      themeType === THEME_TYPES.DARK ? [...PROGRESS_TIER_COLORS].reverse() : PROGRESS_TIER_COLORS,
    [themeType]
  )
  const [width, setWidth] = useState(0)
  const availableWidth = Math.max(width - THUMB_SIZE, 0)
  const totalValue = stakedValue + maximumValue
  const stakedSteps = totalValue > 0n ? (stakedValue * SLIDER_STEPS) / totalValue : 0n
  const stakedWidth = Number(stakedSteps) * (availableWidth / Number(SLIDER_STEPS))
  const draggableWidth = Math.max(availableWidth - stakedWidth, 0)
  const clampedValue = value < 0n ? 0n : value > maximumValue ? maximumValue : value
  const sliderStep = maximumValue > 0n ? (clampedValue * SLIDER_STEPS) / maximumValue : 0n
  const thumbPosition = stakedWidth + Number(sliderStep) * (draggableWidth / Number(SLIDER_STEPS))
  const tooltipDataSet = useMemo(
    () =>
      stakedLabel
        ? createGlobalTooltipDataSet({ id: 'wallet-staking-slider-staked', content: stakedLabel })
        : undefined,
    [stakedLabel]
  )
  // A repeating diagonal-stripe pattern that, together with the staked segment's own muted color
  // (distinct from the plain, unfilled track), makes the disabled/unreachable part of the slider
  // obviously disabled. Web only - React Native has no cross-platform equivalent of a CSS
  // background image.
  const stakedSegmentWebStyle = useMemo(() => {
    if (!isWeb) return undefined

    const stripeColor = hexToRgba(String(theme.secondaryBackground), 0.6)
    return {
      backgroundImage: `repeating-linear-gradient(-45deg, ${stripeColor}, ${stripeColor} 3px, transparent 3px, transparent 7px)`
    } as unknown as ViewStyle
  }, [theme.secondaryBackground])
  // All thresholds within range, regardless of whether the staked balance alone already clears
  // them - needed to know the *true* tier the staked balance already starts at (see
  // startTierIndex below), so a segment's color always reflects its real tier instead of
  // resetting to the dimmest shade whenever thresholds are hidden inside the staked segment.
  const allBoundaries = useMemo(
    () =>
      (thresholds || [])
        .map(({ value: thresholdValue }) => thresholdValue)
        .filter((thresholdValue) => thresholdValue > 0n && thresholdValue < totalValue)
        .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
    [thresholds, totalValue]
  )
  const startTierIndex = useMemo(
    () => allBoundaries.filter((thresholdValue) => thresholdValue <= stakedValue).length,
    [allBoundaries, stakedValue]
  )
  const tierBoundaries = useMemo(
    () => allBoundaries.filter((thresholdValue) => thresholdValue > stakedValue),
    [allBoundaries, stakedValue]
  )
  // Splits the filled part of the track (0..clampedValue) into one segment per fee tier it
  // spans, each rendered in a different shade - see PROGRESS_TIER_COLORS.
  const progressSegments = useMemo(() => {
    if (clampedValue <= 0n) return []

    const points = [stakedValue, ...tierBoundaries, totalValue]
    const filledEnd = stakedValue + clampedValue
    const segments: { key: string; widthSteps: bigint }[] = []

    for (let i = 0; i < points.length - 1; i += 1) {
      const segmentStart = points[i] as bigint
      const nextPoint = points[i + 1] as bigint
      if (segmentStart >= filledEnd) break

      const segmentEnd = nextPoint < filledEnd ? nextPoint : filledEnd
      if (segmentEnd <= segmentStart) continue

      const startSteps = ((segmentStart - stakedValue) * SLIDER_STEPS) / clampedValue
      const endSteps = ((segmentEnd - stakedValue) * SLIDER_STEPS) / clampedValue
      segments.push({ key: `${segmentStart}`, widthSteps: endSteps - startSteps })
    }

    return segments
  }, [clampedValue, stakedValue, tierBoundaries, totalValue])
  console.log(progressSegments)
  const progressWidth = Math.max(thumbPosition - stakedWidth, 0)
  const thresholdMarkers = useMemo(
    () =>
      tierBoundaries.map((thresholdValue) => {
        const steps = (thresholdValue * SLIDER_STEPS) / totalValue
        const position = Number(steps) * (availableWidth / Number(SLIDER_STEPS))
        const matchingThreshold = (thresholds || []).find(({ value: v }) => v === thresholdValue)
        return { ...matchingThreshold, value: thresholdValue, position }
      }),
    [availableWidth, thresholds, tierBoundaries, totalValue]
  )

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width)
  }, [])

  const updateValue = useCallback(
    (locationX: number) => {
      if (!draggableWidth || maximumValue <= 0n) return

      const position = Math.min(
        Math.max(locationX - THUMB_SIZE / 2, stakedWidth),
        stakedWidth + draggableWidth
      )
      const relativePosition = position - stakedWidth
      const nextStep = BigInt(
        Math.round((relativePosition / draggableWidth) * Number(SLIDER_STEPS))
      )
      onValueChange((maximumValue * nextStep) / SLIDER_STEPS)
    },
    [draggableWidth, maximumValue, onValueChange, stakedWidth]
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
          {stakedWidth > 0 && (
            <View
              dataSet={tooltipDataSet}
              style={[styles.amountSliderStaked, { width: stakedWidth }, stakedSegmentWebStyle]}
            />
          )}
          <View
            style={[
              styles.amountSliderProgressContainer,
              { left: THUMB_SIZE / 2 + stakedWidth, width: progressWidth }
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
      <View style={styles.amountSliderLabels}>
        <Text fontSize={11} appearance="secondaryText">
          0
        </Text>
        <Text fontSize={11} appearance="secondaryText">
          {maximumLabel}
        </Text>
      </View>
    </View>
  )
}

export default React.memo(AmountSlider)
