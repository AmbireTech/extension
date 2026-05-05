import React from 'react'
import { Pressable, View } from 'react-native'
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller'
import Animated, { useAnimatedStyle, useDerivedValue, withSpring } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useCameraPermission } from 'react-native-vision-camera'

import ScanIcon from '@common/assets/svg/ScanIcon'
import GlassView from '@common/components/GlassView'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import SelectNetwork from '@common/modules/dashboard/components/TabsAndSearch/SelectNetwork'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings, { SPACING } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import DashboardSearch from './DashboardSearch'
import { FloatingBottomBarProps } from './FloatingBottomBar'

const FloatingBottomBar: React.FC<FloatingBottomBarProps> = ({
  control,
  displayNetworkFilter = false,
  isHidden
}) => {
  const { bottom: safeBottom } = useSafeAreaInsets()
  const { height } = useReanimatedKeyboardAnimation()
  const { theme } = useTheme()
  const { navigate } = useNavigation()
  const { addToast } = useToast()
  const { hasPermission, requestPermission, canRequestPermission } = useCameraPermission()

  const handleQrPress = async () => {
    if (hasPermission) {
      navigate(ROUTES.qrReader)
    } else {
      console.log('canRequestPermission', canRequestPermission)
      const granted = canRequestPermission && (await requestPermission())
      console.log('granted', granted)
      if (granted) {
        navigate(ROUTES.qrReader)
      } else {
        addToast('Camera permission is required to scan QR codes.', { type: 'error' })
      }
    }
  }

  const animatedBottom = useDerivedValue(() => {
    const toValue = isHidden ? -60 - safeBottom : SPACING + safeBottom
    return withSpring(toValue, {
      damping: 20,
      stiffness: 90,
      overshootClamping: true
    })
  }, [isHidden, safeBottom])

  const animatedStyle = useAnimatedStyle(() => {
    const keyboardOffset = Math.abs(height.value)
    return {
      bottom: animatedBottom.value + keyboardOffset
    }
  }, [height])

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
          <DashboardSearch control={control} />
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
