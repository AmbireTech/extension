import React, { useCallback, useMemo, useRef, useState } from 'react'
import { AccessibilityActionEvent, Keyboard, LayoutChangeEvent, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'

import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import HoverablePressable from '@common/components/HoverablePressable'
import Text from '@common/components/Text'
import { captureException } from '@common/config/analytics/CrashAnalytics'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import { ACCENT_PRIMITIVES } from '@common/styles/theme/primitives'
import { THEME_TYPES } from '@common/styles/theme/types'

import { getSliderMarks, Mark, SLIDER_STEPS } from './getSliderMarks'
import getStyles, { MARK_SIZE } from './styles'

const THUMB_SIZE = 20
// How far a dot at either end of the track sits from that end - see the edge alignment in markers.
const EDGE_MARK_INSET = 1
const ACCESSIBILITY_STEP = SLIDER_STEPS / 20n
const ACCESSIBILITY_ACTIONS = [{ name: 'increment' }, { name: 'decrement' }] as const
// A press is a deliberate "give me that mark", so pressing within this many px of a dot (or of
// either end of the track) lands exactly on it. A drag never snaps - it is a fine adjustment.
const PRESS_SNAP_RADIUS = 24
// Linearly maps x from [fromStart, fromEnd] onto [toStart, toEnd].
const interpolate = (
  x: number,
  [fromStart, fromEnd]: [number, number],
  [toStart, toEnd]: [number, number]
) =>
  fromEnd === fromStart
    ? toStart
    : toStart + ((x - fromStart) * (toEnd - toStart)) / (fromEnd - fromStart)
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

interface Props {
  value: bigint
  maximumValue: bigint
  onValueChange: (value: bigint) => void
  accessibilityLabel?: string
  /** The amount already held before this slider's draggable range even starts - e.g. the tokens
   * already staked. Not shown on the track itself; it only shifts the marks so they still land at
   * the correct absolute amount rather than at `mark - alreadyHeldAmount`. */
  tierOffset?: bigint
  /** The dots on the track, as absolute amounts on the same axis as `tierOffset` - the drag snaps
   * onto them and the filled track is shaded by the range each one opens. Marks outside the
   * draggable range are ignored. Defaults to the quarters (0/25/50/75/100%), which are dots only
   * and leave the filled track a single shade. */
  marks?: Mark[]
}

const AmountSlider = ({
  value,
  maximumValue,
  onValueChange,
  accessibilityLabel,
  tierOffset = 0n,
  marks
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
  const clampedValue = value < 0n ? 0n : value > maximumValue ? maximumValue : value
  const sliderStep = maximumValue > 0n ? (clampedValue * SLIDER_STEPS) / maximumValue : 0n
  // Values live on the track's own axis, edge to edge, so a mark and the thumb picking it out
  // always land on the same spot.
  const fractionOfWidth = useCallback(
    (steps: bigint) => (Number(steps) / Number(SLIDER_STEPS)) * width,
    [width]
  )
  // Only the thumb's rendering is pulled back inside the track, so it can't hang off either end.
  // The half it shifts by at 0% and 100% is covered by the thumb itself, which is why the mark
  // underneath still looks centered.
  const thumbPosition = Math.min(
    Math.max(fractionOfWidth(sliderStep) - THUMB_SIZE / 2, 0),
    Math.max(width - THUMB_SIZE, 0)
  )
  // The marks that actually split the filled track into shaded tiers - a mark beyond
  // `maximumValue` away from `tierOffset` isn't reachable by dragging, and one already covered by
  // tierOffset alone doesn't open a tier of its own (see startTierIndex below, which colors the
  // segment as if already past it).
  const allBoundaries = useMemo(
    () =>
      (marks || [])
        .map(({ value: markValue }) => markValue)
        .filter((markValue) => markValue > 0n && markValue < tierOffset + maximumValue)
        .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
    [marks, maximumValue, tierOffset]
  )
  const startTierIndex = useMemo(
    () => allBoundaries.filter((markValue) => markValue <= tierOffset).length,
    [allBoundaries, tierOffset]
  )
  const tierBoundaries = useMemo(
    () => allBoundaries.filter((markValue) => markValue > tierOffset),
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
  const progressWidth = Math.max(fractionOfWidth(sliderStep), 0)
  // Every dot on the track, on the slider's own axis - the same list the drag snaps onto.
  const markers = useMemo(() => {
    return getSliderMarks({ marks, maximumValue, tierOffset }).map((mark) => {
      const position = fractionOfWidth(mark.steps)
      // Every dot but one sitting at either end of the track is centered on its own position.
      // Those are pulled fully inside the track instead, so they sit flush with its rounded caps
      // rather than hanging half a dot over the end.
      const edgeOffset =
        position <= 0
          ? EDGE_MARK_INSET
          : position >= width
            ? -MARK_SIZE - EDGE_MARK_INSET
            : -MARK_SIZE / 2

      return {
        ...mark,
        position,
        left: position + edgeOffset
      }
    })
  }, [fractionOfWidth, marks, maximumValue, tierOffset, width])

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
      // A drag fires dozens of times a second, most of them landing back on the amount that is
      // already set - re-rendering the whole form for those is pure waste.
      if (nextValue === clampedValue) return

      try {
        onValueChange(nextValue)
      } catch (error) {
        console.error('Failed to apply the amount slider value', error)
        captureException(error)
      }
    },
    [clampedValue, onValueChange]
  )

  // Where on the track the value sat once the press was handled - the drag moves it from there
  // instead of jumping it under the pointer (see handleDrag).
  const dragStartPositionRef = useRef(0)
  // The pointer's x when the press turned into a drag, i.e. already past activeOffsetX's slop.
  const dragAnchorXRef = useRef(0)

  // Guards every calculation it feeds, but the BigInt conversion in emitPosition above all - it
  // throws on anything that isn't a whole, finite number.
  const getTrackPosition = useCallback(
    (locationX: number) => {
      if (!width || maximumValue <= 0n || !Number.isFinite(locationX)) return null

      return Math.min(Math.max(locationX, 0), width)
    },
    [maximumValue, width]
  )

  const emitPosition = useCallback(
    (position: number) => {
      const rawStep = Math.round((position / width) * Number(SLIDER_STEPS))
      const nextStep = BigInt(Math.min(Math.max(rawStep, 0), Number(SLIDER_STEPS)))
      emitValueChange((maximumValue * nextStep) / SLIDER_STEPS)
    },
    [emitValueChange, maximumValue, width]
  )

  const handlePress = useCallback(
    (locationX: number) => {
      const position = getTrackPosition(locationX)
      if (position === null) return

      // Grabbing the thumb itself only starts a drag. Moving the value to the exact pointer
      // position would shift it by up to half a thumb before the drag has even started.
      if (position >= thumbPosition && position <= thumbPosition + THUMB_SIZE) {
        dragStartPositionRef.current = fractionOfWidth(sliderStep)
        return
      }

      // Snap: land exactly on a mark's own value (not just its nearest slider step) whenever the
      // press is close to its dot, from either side. The track's own two ends snap the same way
      // and, listed first, win a tie - but only a tie: a mark sitting closer to the pointer than
      // an end beats it, or one that happens to sit within the press radius of an end would never
      // be reachable by pressing on it.
      const snapPoints: { amount: bigint; position: number }[] = [
        { amount: 0n, position: 0 },
        { amount: maximumValue, position: width },
        ...markers.map(({ amount, position: markPosition }) => ({
          amount,
          position: markPosition
        }))
      ]
      const nearestSnapPoint = snapPoints.reduce<(typeof snapPoints)[number] | null>(
        (nearest, snapPoint) => {
          const distance = Math.abs(snapPoint.position - position)
          if (distance > PRESS_SNAP_RADIUS) return nearest

          return !nearest || distance < Math.abs(nearest.position - position) ? snapPoint : nearest
        },
        null
      )
      // Already on that mark, a press nearby is a fine adjustment, so it lands where pressed.
      if (nearestSnapPoint && nearestSnapPoint.amount !== clampedValue) {
        dragStartPositionRef.current = nearestSnapPoint.position
        emitValueChange(nearestSnapPoint.amount)
        return
      }

      dragStartPositionRef.current = position
      emitPosition(position)
    },
    [
      clampedValue,
      emitPosition,
      emitValueChange,
      fractionOfWidth,
      getTrackPosition,
      markers,
      maximumValue,
      sliderStep,
      thumbPosition,
      width
    ]
  )

  const handleDragStart = useCallback(
    (locationX: number) => {
      const position = getTrackPosition(locationX)
      if (position === null) return

      dragAnchorXRef.current = position
    },
    [getTrackPosition]
  )

  // Moves the value relative to where the drag started, so it doesn't skip the activation slop and
  // the grab offset. The pointer's way to each end maps onto the value's, so both stay reachable.
  const handleDrag = useCallback(
    (locationX: number) => {
      const position = getTrackPosition(locationX)
      if (position === null) return

      const anchorX = dragAnchorXRef.current
      const startPosition = dragStartPositionRef.current
      emitPosition(
        position >= anchorX
          ? interpolate(position, [anchorX, width], [startPosition, width])
          : interpolate(position, [0, anchorX], [0, startPosition])
      )
    },
    [emitPosition, getTrackPosition, width]
  )

  // The builder only stores these callbacks for later gesture events, it never invokes them
  // during render, so the refs they touch are only ever read inside those events
  /* eslint-disable react-hooks/refs */
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
          // Grabbing the slider ends typing: the screen keeps the keyboard up on taps, and an amount
          // field left focused is never remounted (see useTextInputRemountKey), so a drag could crash
          if (!isWeb) Keyboard.dismiss()
          handlePress(x)
        })
        .onStart(({ x }) => handleDragStart(x))
        .onUpdate(({ x }) => handleDrag(x)),
    [handleDrag, handleDragStart, handlePress, maximumValue]
  )
  /* eslint-enable react-hooks/refs */
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
    <View style={styles.wrapper}>
      <GestureDetector gesture={panGesture}>
        <HoverablePressable
          accessible
          accessibilityActions={ACCESSIBILITY_ACTIONS}
          accessibilityLabel={accessibilityLabel || t('Amount')}
          accessibilityRole="adjustable"
          accessibilityValue={accessibilityValue}
          onAccessibilityAction={handleAccessibilityAction}
          onLayout={handleLayout}
          disabled={isDisabled}
          style={[styles.slider, isDisabled && styles.disabled]}
        >
          <View style={styles.track} />
          <View style={[styles.progressContainer, { width: progressWidth }]}>
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
          {markers.map((marker) => (
            <View
              key={marker.key}
              dataSet={
                marker.tooltipContent && marker.tooltipId
                  ? createGlobalTooltipDataSet({
                      id: marker.tooltipId,
                      content: marker.tooltipContent
                    })
                  : undefined
              }
              style={[styles.mark, { left: marker.left }]}
            />
          ))}
          <View style={[styles.thumb, { left: thumbPosition }]}>
            <View style={styles.thumbInner} />
          </View>
        </HoverablePressable>
      </GestureDetector>
      <View style={styles.percentage}>
        <Text
          fontSize={12}
          weight="medium"
          appearance="secondaryText"
          style={{ position: 'absolute', textAlign: 'center', width: 34 }}
        >
          {`${Math.round(Number(sliderStep) / 100)}%`}
        </Text>
      </View>
    </View>
  )
}

export default React.memo(AmountSlider)
