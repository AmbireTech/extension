import { ReactNode, useEffect } from 'react'
import { BackHandler } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

import {
  bottomSheetCloseEventStream,
  openBottomSheetsCount
} from '@common/components/BottomSheet/bottomSheetEventStream'
import { isAndroid } from '@common/config/env'
import useBackAction from '@common/hooks/useBackAction'
import { entropyTouchHandlers } from '@common/hooks/useExtraEntropy/useExtraEntropy.native'
import usePrevious from '@common/hooks/usePrevious'
import useRoute from '@common/hooks/useRoute'
import useTheme from '@common/hooks/useTheme'
import flexbox from '@common/styles/utils/flexbox'

const GestureHandler = ({ children }: { children: ReactNode }) => {
  const { theme } = useTheme()
  const goBackAction = useBackAction()
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
      goBackAction()

      return true
    }

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction)

    return () => backHandler.remove()
  }, [goBackAction])

  return (
    // The touch handlers only read the coordinates of touches bubbling up from the tree, to
    // feed the extra entropy pool used when generating seeds and Keystore secrets. They do not
    // participate in responder negotiation, so they cannot interfere with the gestures below.
    <GestureHandlerRootView
      style={[flexbox.flex1, { backgroundColor: theme.primaryBackground }]}
      {...entropyTouchHandlers}
    >
      {/* Only the edge-swipe-back Pan gesture remains. The former app-wide */}
      {/* Gesture.Manual() touch observer (used to dismiss dropdowns on an outside */}
      {/* tap) was removed: left unresolved — and its manager.fail() was a no-op */}
      {/* because .runOnJS(true) runs it off-worklet — it held the touch responder */}
      {/* and froze every Pressable until the app was killed. */}
      {children}
    </GestureHandlerRootView>
  )
}

export default GestureHandler
