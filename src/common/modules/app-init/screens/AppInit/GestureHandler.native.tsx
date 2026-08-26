import { ReactNode, useEffect, useMemo } from 'react'
import { BackHandler, Dimensions, GestureResponderEvent, Platform } from 'react-native'
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler'

import {
  bottomSheetCloseEventStream,
  openBottomSheetsCount
} from '@common/components/BottomSheet/bottomSheetEventStream'
import { checkDropdownDismiss } from '@common/components/Dropdown/dropdownDismissManager'
import { isAndroid } from '@common/config/env'
import { entropyTouchHandlers } from '@common/hooks/useExtraEntropy/useExtraEntropy.native'
import useNavigation from '@common/hooks/useNavigation'
import usePrevious from '@common/hooks/usePrevious'
import useRoute from '@common/hooks/useRoute'
import useTheme from '@common/hooks/useTheme'
import { ROUTES } from '@common/modules/router/constants/common'
import { goBackInWebViewHistory } from '@common/services/webview/webViewBackNavigation'
import flexbox from '@common/styles/utils/flexbox'

const GestureHandler = ({ children }: { children: ReactNode }) => {
  const { theme } = useTheme()
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
        } else if (!goBackInWebViewHistory()) {
          goBack()
        }
      }

      return true
    }

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction)

    return () => backHandler.remove()
  }, [path, canGoBack, goBack])

  // Memoized so GestureDetector receives a stable gesture object rather than a
  // freshly-built one every render (each rebuild needlessly re-attaches the
  // native handler). Deps are stable during a screen's lifetime and change only
  // on navigation.
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
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
          const { width } = Dimensions.get('window')
          const startX = e.absoluteX - e.translationX
          const isFromLeftEdge = startX < width * 0.2

          // 3. Logic: Trigger if moved 20% OR flicked fast (velocity > 500)
          const isSwipedRight = e.translationX > width * 0.2 || e.velocityX > 500

          if (isFromLeftEdge && isSwipedRight) {
            if (openBottomSheetsCount.value > 0) {
              bottomSheetCloseEventStream.next()
              return
            }

            if (goBackInWebViewHistory()) return

            if (canGoBack) {
              goBack()
            }
          }
        }),
    [path, canGoBack, goBack]
  )

  // Both of these only read touches bubbling up from the tree: the entropy pool takes their
  // coordinates, and an open dropdown closes when the touch did not start inside it. Neither takes
  // part in responder negotiation, so they cannot interfere with the gestures below and the touch
  // still reaches the element underneath - a button outside an open dropdown fires on the first tap.
  const rootTouchHandlers = useMemo(
    () => ({
      ...entropyTouchHandlers,
      onTouchStart: (e: GestureResponderEvent) => {
        entropyTouchHandlers.onTouchStart(e)
        checkDropdownDismiss()
      }
    }),
    []
  )

  return (
    <GestureHandlerRootView
      style={[flexbox.flex1, { backgroundColor: theme.primaryBackground }]}
      {...rootTouchHandlers}
    >
      {/* Only the edge-swipe-back Pan gesture remains. Dropdown dismissal used to be */}
      {/* another Gesture.Manual() observer here, which froze every Pressable until the */}
      {/* app was killed: left unresolved — and its manager.fail() was a no-op because */}
      {/* .runOnJS(true) runs it off-worklet — it held the touch responder. Hence the */}
      {/* plain bubbling onTouchStart above instead of a second gesture. */}
      <GestureDetector gesture={panGesture}>{children}</GestureDetector>
    </GestureHandlerRootView>
  )
}

export default GestureHandler
