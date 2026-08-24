import React, { useCallback, useMemo, useState } from 'react'
import {
  AccessibilityActionEvent,
  GestureResponderEvent,
  LayoutChangeEvent,
  View
} from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'

import HoverablePressable from '@common/components/HoverablePressable'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'

import getStyles from './styles'

const THUMB_SIZE = 20
const SLIDER_STEPS = 10000n
const ACCESSIBILITY_STEP = SLIDER_STEPS / 20n
const ACCESSIBILITY_ACTIONS = [{ name: 'increment' }, { name: 'decrement' }] as const

interface Props {
  value: bigint
  maximumValue: bigint
  maximumLabel: string
  onValueChange: (value: bigint) => void
  accessibilityLabel?: string
}

const AmountSlider = ({
  value,
  maximumValue,
  maximumLabel,
  onValueChange,
  accessibilityLabel
}: Props) => {
  const { t } = useTranslation()
  const { styles } = useTheme(getStyles)
  const [width, setWidth] = useState(0)
  const availableWidth = Math.max(width - THUMB_SIZE, 0)
  const clampedValue = value < 0n ? 0n : value > maximumValue ? maximumValue : value
  const sliderStep = maximumValue > 0n ? (clampedValue * SLIDER_STEPS) / maximumValue : 0n
  const thumbPosition = Number(sliderStep) * (availableWidth / Number(SLIDER_STEPS))

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width)
  }, [])

  const updateValue = useCallback(
    (locationX: number) => {
      if (!availableWidth || maximumValue <= 0n) return

      const position = Math.min(Math.max(locationX - THUMB_SIZE / 2, 0), availableWidth)
      const nextStep = BigInt(Math.round((position / availableWidth) * Number(SLIDER_STEPS)))
      onValueChange((maximumValue * nextStep) / SLIDER_STEPS)
    },
    [availableWidth, maximumValue, onValueChange]
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
          <View style={[styles.amountSliderProgress, { width: thumbPosition }]} />
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
