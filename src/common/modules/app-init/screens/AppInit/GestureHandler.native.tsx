import { ReactNode, useEffect, useRef } from 'react'
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

  // Read through a ref so the listener below is registered once. Android calls the latest
  // registered one first, so re-registering on every navigation would outrank the screens' own.
  const goBackActionRef = useRef(goBackAction)
  useEffect(() => {
    goBackActionRef.current = goBackAction
  }, [goBackAction])

  useEffect(() => {
    if (!isAndroid) return

    // When nothing in the app can consume the press, Android handles it as it normally
    // would and sends the app to the background
    const backAction = () => goBackActionRef.current()

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction)

    return () => backHandler.remove()
  }, [])

  return (
    // The touch handlers only read the coordinates of touches bubbling up from the tree, to
    // feed the extra entropy pool used when generating seeds and Keystore secrets. They do not
    // take part in responder negotiation, so the touch still reaches the element underneath.
    <GestureHandlerRootView
      style={[flexbox.flex1, { backgroundColor: theme.primaryBackground }]}
      {...entropyTouchHandlers}
    >
      {children}
    </GestureHandlerRootView>
  )
}

export default GestureHandler
