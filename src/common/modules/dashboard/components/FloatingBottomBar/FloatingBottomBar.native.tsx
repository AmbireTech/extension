import React, { useCallback, useEffect } from 'react'
import { AppState, Pressable, View } from 'react-native'
import {
  useKeyboardHandler,
  useReanimatedKeyboardAnimation
} from 'react-native-keyboard-controller'
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import ScanIcon from '@common/assets/svg/ScanIcon'
import GlassView from '@common/components/GlassView'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings, { SPACING } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import DashboardSearch from './DashboardSearch'
import SelectNetwork from './SelectNetwork'
import { FloatingBottomBarProps } from './FloatingBottomBar'

const FloatingBottomBar: React.FC<FloatingBottomBarProps> = ({
  control,
  networkFilterTab,
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

  // Follows the keyboard by a transform rather than by `bottom`, so it never relayouts anything.
  // Hiding it is the carousel's, which moves it together with the overview
  const animatedStyle = useAnimatedStyle(() => {
    const keyboardOffset = isKeyboardHeightStale.value ? 0 : Math.abs(height.value)
    return {
      transform: [{ translateY: -keyboardOffset }]
    }
  }, [height, isKeyboardHeightStale])

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          bottom: SPACING + safeBottom,
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
          {!!control && <DashboardSearch control={control} placeholder={searchPlaceholder} />}
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
          {!!networkFilterTab && <SelectNetwork currentTab={networkFilterTab} />}
        </View>
      </GlassView>
    </Animated.View>
  )
}

export default React.memo(FloatingBottomBar)
