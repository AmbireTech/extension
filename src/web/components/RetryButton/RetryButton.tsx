import React, { FC, useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Animated } from 'react-native'

import RetryIcon from '@common/assets/svg/RetryIcon'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { AnimatedPressable, useCustomHover } from '@web/hooks/useHover'

type Props = {
  onPress: () => void
  label?: string
}

const RetryButton: FC<Props> = ({ onPress, label }) => {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const buttonLabel = label ?? t('Retry')
  const rotateAnim = useRef(new Animated.Value(0)).current
  const [bindAnim, animStyle] = useCustomHover({
    property: 'backgroundColor',
    values: {
      from: `${theme.primary as string}14`,
      to: theme.primary20
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
      borderRadius: 14,
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...animStyle,
      ...spacings.phTy,
      minHeight: 28,
      paddingLeft: 10
    }),
    [animStyle]
  )

  return (
    <AnimatedPressable style={buttonStyle} onPress={onPress} {...mergedBindAnim}>
      <Text fontSize={12} weight="medium" color={theme.primary} style={spacings.mrTy}>
        {buttonLabel}
      </Text>
      <Animated.View style={{ transform: [{ rotateZ: rotateInterpolate }] }}>
        <RetryIcon color={theme.primary} />
      </Animated.View>
    </AnimatedPressable>
  )
}

export default RetryButton
