import * as SplashScreen from 'expo-splash-screen'
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { AppState, View } from 'react-native'
import { KeyboardController } from 'react-native-keyboard-controller'

import { useTranslation } from '@common/config/localization'
import { ControllersMiddlewareContext } from '@common/contexts/controllersMiddlewareContext'
import { ControllersStateLoadedContext } from '@common/contexts/controllersStateLoadedContext'
import useController from '@common/hooks/useController'
import useFonts from '@common/hooks/useFonts'
import useToast from '@common/hooks/useToast'
import { AUTH_STATUS } from '@common/modules/auth/constants/authStatus'
import useAuth from '@common/modules/auth/hooks/useAuth'
import eventBus from '@common/services/event/eventBus'
import flexbox from '@common/styles/utils/flexbox'
import useMobileInviteGate from '@mobile/hooks/useMobileInviteGate'
import useNativeThemeSync from '@mobile/hooks/useNativeThemeSync'
import useLedgerConnectionLifecycle from '@mobile/modules/hardware-wallet/hooks/useLedgerConnectionLifecycle'
import InviteVerifyScreen from '@mobile/modules/invite/screens/InviteVerifyScreen'
import RequestsBottomSheet from '@mobile/modules/router/components/RequestsBottomSheet'
import NavigationStack from '@mobile/modules/router/stack'
import { markSplashHidden } from '@mobile/services/bootProfiler'

const Router = () => {
  const { t } = useTranslation()
  const { addToast, removeToast } = useToast()

  const { canRenderRoute, areAllControllerStatesLoaded, isStatesLoadingTakingTooLong } = useContext(
    ControllersStateLoadedContext
  )
  const { authStatus } = useAuth()
  const keystoreState = useController('KeystoreController').state
  const { requestModalRef, closeRequestModal, onBottomSheetClosed, onBottomSheetOpened } =
    useController('RequestsController')
  // The mobile app is invite-only for fresh installs. Lives here rather than in a route guard,
  // because this is the one component that is mounted no matter where the app has navigated to.
  const { isGateEnforced } = useMobileInviteGate()
  const { dispatch } = useContext(ControllersMiddlewareContext)
  // Fonts load in parallel with controller boot (the tree mounts before fonts
  // are ready — see AppInit). Gate the splash hide on fonts too so the first
  // painted frame already has the custom fonts applied.
  const { fontsLoaded } = useFonts()

  // Disconnect the Ledger BLE transport when the wallet locks or the app is
  // backgrounded; it transparently reconnects on the next device operation.
  useLedgerConnectionLifecycle(keystoreState.isUnlocked)

  // Wrap onBottomSheetClosed to emit event for DappWebViewScreen focus
  // Must be at top level before any early returns
  const handleBottomSheetClosed = useCallback(() => {
    onBottomSheetClosed?.()
    // Emit event so DappWebViewScreen can dispatch focus to the WebView
    eventBus.emit('requestsBottomSheet.closed')
  }, [onBottomSheetClosed])

  const splashHideRequested = useRef(false)
  const [isSplashHidden, setIsSplashHidden] = useState(false)

  const isReady = authStatus !== AUTH_STATUS.LOADING && canRenderRoute && fontsLoaded

  // A controller that never reports leaves the screens that wait on it on a skeleton
  // forever, so tell the user instead of animating at them indefinitely. The store
  // raises the alarm only for the controllers whose wait is not expected, which is the
  // same set this flag covers.
  const hasStalledLoading = isStatesLoadingTakingTooLong && !areAllControllerStatesLoaded

  // The status bar and the native appearance must not be touched while the
  // splash screen is still on screen, hence the gate on the fade being over
  // instead of on `isReady`.
  useNativeThemeSync(isSplashHidden)

  useEffect(() => {
    if ((isReady || hasStalledLoading) && !splashHideRequested.current) {
      splashHideRequested.current = true
      SplashScreen.setOptions({ duration: 200, fade: true })
      SplashScreen.hideAsync()
        .finally(() => {
          setIsSplashHidden(true)
          markSplashHidden()
        })
        .catch(() => {})
      // Now that the splash is hidden, let the webview worker stream the
      // heavy controller states (portfolio, dapps, activity, ...) that were
      // held back during the critical boot phase. Done after the splash hide
      // call so any cost of draining the queue does not delay the first paint.
      dispatch({ type: 'SET_BOOT_PHASE', params: { phase: 'full' } })
    }
  }, [isReady, hasStalledLoading, dispatch])

  // Dismiss the keyboard the moment the app leaves the foreground so iOS never
  // snapshots a visible keyboard, which would otherwise flash on the next launch.
  // Not animated, because the app suspends mid-animation and the keyboard
  // position values freeze at whatever height the last delivered frame had.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'active') KeyboardController.dismiss({ animated: false })
    })

    return () => sub.remove()
  }, [])

  // Warn about the wait without taking over the screen, so whatever the app already
  // managed to render stays up. Clears itself the moment the states arrive.
  useEffect(() => {
    if (!hasStalledLoading) return

    const toastId = addToast(
      t(
        "The initial loading is taking longer than expected. This might be due to a connection issue on your side - or a glitch on ours. If it doesn't resolve soon, please close and reopen the app."
      ),
      { type: 'warning', sticky: true }
    )

    return () => removeToast(toastId)
  }, [hasStalledLoading, addToast, removeToast, t])

  // Keep the native splash screen visible until controllers, auth and fonts are ready
  if (!isReady) {
    return null
  }

  // Nothing else may render until the invite code is verified. The app keeps navigating
  // underneath, so the route the controllers picked is already there once the gate opens.
  if (isGateEnforced) return <InviteVerifyScreen />

  return (
    <View style={flexbox.flex1}>
      <NavigationStack />

      <RequestsBottomSheet
        sheetRef={requestModalRef as any}
        closeBottomSheet={closeRequestModal as any}
        onClosed={handleBottomSheetClosed}
        onOpened={onBottomSheetOpened as any}
      />
    </View>
  )
}

export default Router
