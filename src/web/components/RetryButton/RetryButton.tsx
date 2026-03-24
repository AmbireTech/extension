import React, { FC, useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Animated } from 'react-native'

import RetryIcon from '@common/assets/svg/RetryIcon'
import Text from '@common/components/Text'
import { isMobile } from '@common/config/env'
import { AnimatedPressable, useCustomHover } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_SM, SPACING_TY } from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY, hexToRgba } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  onPress: () => void
  label?: string
  disabled?: boolean
  isLarge?: boolean
}

const RetryButton: FC<Props> = ({ onPress, label, disabled, isLarge }) => {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const buttonLabel = label ?? t('Retry')
  const rotateAnim = useRef(new Animated.Value(0)).current
  const [bindAnim, animStyle] = useCustomHover({
    property: 'backgroundColor',
    values: {
      from: hexToRgba(theme.primaryAccent100, 1),
      to: hexToRgba(theme.primaryAccent200, 0.16)
    }
  })

  const handleHoverIn = useCallback(() => {
    Animated.timing(rotateAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true
    }).start()
  }, [rotateAnim])

  const handleHoverOut = useCallback(() => {
    Animated.timing(rotateAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true
    }).start()
  }, [rotateAnim])

  const rotateInterpolate = useMemo(
    () =>
      rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '-360deg']
      }),
    [rotateAnim]
  )

  const mergedBindAnim = useMemo(
    () => ({
      ...bindAnim,
      onHoverIn: (event: any) => {
        bindAnim.onHoverIn?.(event)
        handleHoverIn()
      },
      onHoverOut: (event: any) => {
        bindAnim.onHoverOut?.(event)
        handleHoverOut()
      }
    }),
    [bindAnim, handleHoverIn, handleHoverOut]
  )

  const buttonStyle = useMemo(
    () => ({
      borderRadius: isMobile ? BORDER_RADIUS_PRIMARY : 14,
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...animStyle,
      paddingLeft: isMobile ? SPACING_SM : 6,
      paddingRight: isMobile ? SPACING_TY : 2,
      minHeight: isLarge ? 28 : 20,
      ...(disabled && { opacity: 0.5 })
    }),
    [animStyle, disabled, isLarge]
  )

  return (
    <AnimatedPressable
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled}
      {...mergedBindAnim}
    >
      <Text fontSize={12} weight="medium" color={theme.primaryAccent300} style={spacings.mrMi}>
        {buttonLabel}
      </Text>
      <Animated.View style={{ transform: [{ rotateZ: rotateInterpolate }] }}>
        <RetryIcon color={theme.primaryAccent300} />
      </Animated.View>
    </AnimatedPressable>
  )
}

export default RetryButton
