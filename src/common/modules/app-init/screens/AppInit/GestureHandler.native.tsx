import { ReactNode } from 'react'
import { Dimensions } from 'react-native'
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler'

import { bottomSheetCloseEventStream, openBottomSheetsCount } from '@common/components/BottomSheet/bottomSheetEventStream'
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

  const panGesture = Gesture.Pan()
    .activeOffsetX(10) // Sensitivity
    .runOnJS(true)
    .onEnd((e) => {
      // 1. Path Guard
      if (
        path === '/' ||
        [ROUTES.dashboard, ROUTES.getStarted, ROUTES.keyStoreUnlock].includes(path)
      ) {
        return
      }

      // 2. Logic: Calculate starting point (10% threshold)
      const startX = e.absoluteX - e.translationX
      const isFromLeftEdge = startX < width * 0.1
      
      // 3. Logic: Trigger if moved 30% OR flicked fast (velocity > 500)
      const isSwipedRight = e.translationX > width * 0.3 || e.velocityX > 500

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
