import { ReactNode, useEffect } from 'react'
import { BackHandler, Dimensions, Platform } from 'react-native'
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler'

import {
  bottomSheetCloseEventStream,
  openBottomSheetsCount
} from '@common/components/BottomSheet/bottomSheetEventStream'
import { isAndroid } from '@common/config/env'
import useNavigation from '@common/hooks/useNavigation'
import useRoute from '@common/hooks/useRoute'
import useTheme from '@common/hooks/useTheme'
import { ROUTES } from '@common/modules/router/constants/common'
import flexbox from '@common/styles/utils/flexbox'

const GestureHandler = ({ children }: { children: ReactNode }) => {
  const { theme } = useTheme()
  const { width } = Dimensions.get('window')
  const { goBack, canGoBack } = useNavigation()
  const { path } = useRoute()

  useEffect(() => {
    if (!isAndroid) return

    const backAction = () => {
      const isRootPath =
        path === '/' || [ROUTES.dashboard, ROUTES.getStarted, ROUTES.keyStoreUnlock].includes(path)

      if (!isRootPath && canGoBack) {
        if (openBottomSheetsCount.value > 0) {
          bottomSheetCloseEventStream.next()
        } else {
          goBack()
        }
      }

      return true
    }

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction)

    return () => backHandler.remove()
  }, [path, canGoBack, goBack])

  const panGesture = Gesture.Pan()
    .activeOffsetX(10) // Sensitivity
    .runOnJS(true)
    .onEnd((e) => {
      if (isAndroid) return

      // 1. Path Guard
      if (
        path === '/' ||
        [ROUTES.dashboard, ROUTES.getStarted, ROUTES.keyStoreUnlock].includes(path)
      ) {
        return
      }

      // 2. Logic: Calculate starting point (10% threshold)
      const startX = e.absoluteX - e.translationX
      const isFromLeftEdge = startX < width * 0.2

      // 3. Logic: Trigger if moved 30% OR flicked fast (velocity > 500)
      const isSwipedRight = e.translationX > width * 0.2 || e.velocityX > 500

      if (isFromLeftEdge && isSwipedRight) {
        if (openBottomSheetsCount.value > 0) {
          bottomSheetCloseEventStream.next()
          return
        }

        if (canGoBack) {
          goBack()
        }
      }
    })

  return (
    <GestureHandlerRootView style={[flexbox.flex1, { backgroundColor: theme.primaryBackground }]}>
      <GestureDetector gesture={panGesture}>{children}</GestureDetector>
    </GestureHandlerRootView>
  )
}

export default GestureHandler
