import React, { useCallback, useEffect } from 'react'
import { AppState, Pressable, View } from 'react-native'
import {
  useKeyboardHandler,
  useReanimatedKeyboardAnimation
} from 'react-native-keyboard-controller'
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import ScanIcon from '@common/assets/svg/ScanIcon'
import GlassView from '@common/components/GlassView'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import SelectNetwork from '@common/modules/dashboard/components/TabsAndSearch/SelectNetwork'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings, { SPACING } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import DashboardSearch from './DashboardSearch'
import { FloatingBottomBarProps } from './FloatingBottomBar'

const FloatingBottomBar: React.FC<FloatingBottomBarProps> = ({
  control,
  displayNetworkFilter = false,
  isHidden,
  searchPlaceholder
}) => {
  const { bottom: safeBottom } = useSafeAreaInsets()
  const { height } = useReanimatedKeyboardAnimation()
  const { theme } = useTheme()
  const { navigate } = useNavigation()

  // The keyboard is always dismissed before the app leaves the foreground, so on
  // resume its height must be treated as 0 even if the shared value never received
  // the final hide frame. Trusting it as-is leaves the bar floating mid-screen.
  const isKeyboardHeightStale = useSharedValue(false)

  useKeyboardHandler(
    {
      onStart: () => {
        'worklet'

        isKeyboardHeightStale.value = false
      }
    },
    [isKeyboardHeightStale]
  )

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') isKeyboardHeightStale.value = true
    })

    return () => subscription.remove()
  }, [isKeyboardHeightStale])

  const handleQrPress = useCallback(() => {
    navigate(ROUTES.qrReader)
  }, [navigate])

  const animatedBottom = useDerivedValue(() => {
    const toValue = isHidden ? -60 - safeBottom : SPACING + safeBottom
    return withSpring(toValue, {
      damping: 20,
      stiffness: 90,
      overshootClamping: true
    })
  }, [isHidden, safeBottom])

  const animatedStyle = useAnimatedStyle(() => {
    const keyboardOffset = isKeyboardHeightStale.value ? 0 : Math.abs(height.value)
    return {
      bottom: animatedBottom.value + keyboardOffset
    }
  }, [height, isKeyboardHeightStale])

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          zIndex: 3,
          ...flexbox.center,
          ...flexbox.alignSelfCenter,
          shadowColor: theme.neutral400,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 1,
          shadowRadius: 8
        },
        animatedStyle
      ]}
    >
      <GlassView borderRadius={28} cssStyle={{ pointerEvents: 'all' }} isSimpleBlur={false}>
        <View
          style={[
            spacings.phTy,
            spacings.pvTy,
            flexbox.directionRow,
            flexbox.alignCenter,
            { columnGap: SPACING }
          ]}
        >
          <DashboardSearch control={control} placeholder={searchPlaceholder} />
          <Pressable
            style={{
              width: 40,
              height: 40,
              backgroundColor: theme.primaryBackground,
              borderRadius: 20,
              ...flexbox.center
            }}
            onPress={handleQrPress}
          >
            <ScanIcon width={24} height={24} />
          </Pressable>
          {displayNetworkFilter && <SelectNetwork />}
        </View>
      </GlassView>
    </Animated.View>
  )
}

export default React.memo(FloatingBottomBar)
