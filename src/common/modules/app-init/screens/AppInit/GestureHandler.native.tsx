import { ReactNode, useEffect, useMemo } from 'react'
import { BackHandler, Dimensions, Platform, StatusBar } from 'react-native'
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler'

import {
  bottomSheetCloseEventStream,
  openBottomSheetsCount
} from '@common/components/BottomSheet/bottomSheetEventStream'
import { checkDropdownDismiss } from '@common/components/Dropdown/dropdownDismissManager'
import { isAndroid } from '@common/config/env'
import useNavigation from '@common/hooks/useNavigation'
import usePrevious from '@common/hooks/usePrevious'
import useRoute from '@common/hooks/useRoute'
import useTheme from '@common/hooks/useTheme'
import { ROUTES } from '@common/modules/router/constants/common'
import flexbox from '@common/styles/utils/flexbox'

const GestureHandler = ({ children }: { children: ReactNode }) => {
  const { theme } = useTheme()
  const { width } = Dimensions.get('window')
  const { goBack, canGoBack } = useNavigation()
  const { path } = useRoute()
  const prevPath = usePrevious(path)

  // Close any open bottom sheets when the route changes, so sheets from the
  // previous screen don't stay visible on top of the new route in the
  // background (e.g. picking an import method from the "No keys to sign" flow
  // navigates away while its bottom sheets remained open)
  useEffect(() => {
    if (prevPath === undefined || prevPath === path) return

    if (openBottomSheetsCount.value > 0) {
      bottomSheetCloseEventStream.next()
    }
  }, [path, prevPath])

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

      // 2. Logic: Calculate starting point (20% threshold)
      const startX = e.absoluteX - e.translationX
      const isFromLeftEdge = startX < width * 0.2

      // 3. Logic: Trigger if moved 20% OR flicked fast (velocity > 500)
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

  const touchObserver = useMemo(
    () =>
      Gesture.Manual()
        .runOnJS(true)
        .onTouchesDown((event) => {
          const touch = event.allTouches[0]
          if (touch) {
            // Android gesture coords are raw screen coords (include the status
            // bar), but Dropdown bounds come from measureInWindow (excludes it).
            // Align them so the outside-touch hit-test compares the same space.
            const absoluteY = isAndroid
              ? touch.absoluteY - (StatusBar.currentHeight ?? 0)
              : touch.absoluteY
            checkDropdownDismiss(touch.absoluteX, absoluteY)
          }
        }),
    []
  )

  const composedGesture = useMemo(
    () => Gesture.Simultaneous(panGesture, touchObserver),
    [panGesture, touchObserver]
  )

  return (
    <GestureHandlerRootView style={[flexbox.flex1, { backgroundColor: theme.primaryBackground }]}>
      <GestureDetector gesture={composedGesture}>{children}</GestureDetector>
    </GestureHandlerRootView>
  )
}

export default GestureHandler
