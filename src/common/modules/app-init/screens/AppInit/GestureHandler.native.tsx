import { ReactNode, useEffect, useMemo } from 'react'
import { BackHandler, GestureResponderEvent } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

import {
  bottomSheetCloseEventStream,
  openBottomSheetsCount
} from '@common/components/BottomSheet/bottomSheetEventStream'
import { checkDropdownDismiss } from '@common/components/Dropdown/dropdownDismissManager'
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

    // When nothing in the app can consume the press, Android handles it as it normally
    // would and sends the app to the background
    const backAction = () => goBackAction()

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction)

    return () => backHandler.remove()
  }, [goBackAction])

  // Both of these only read touches bubbling up from the tree: the entropy pool takes their
  // coordinates (it feeds seed and Keystore secret generation), and an open dropdown closes when the
  // touch did not start inside it. Neither takes part in responder negotiation, so the touch still
  // reaches the element underneath - a button outside an open dropdown fires on the first tap.
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
      {children}
    </GestureHandlerRootView>
  )
}

export default GestureHandler
