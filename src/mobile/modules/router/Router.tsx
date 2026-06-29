import * as SplashScreen from 'expo-splash-screen'
import React, { useCallback, useContext, useEffect, useRef } from 'react'
import { View } from 'react-native'
import { Navigate, Route, Routes } from 'react-router-native'

import { ControllersMiddlewareContext } from '@common/contexts/controllersMiddlewareContext'
import { ControllersStateLoadedContext } from '@common/contexts/controllersStateLoadedContext'
import useController from '@common/hooks/useController'
import useFonts from '@common/hooks/useFonts'
import useRoute from '@common/hooks/useRoute'
import { AUTH_STATUS } from '@common/modules/auth/constants/authStatus'
import useAuth from '@common/modules/auth/hooks/useAuth'
import AuthenticatedRoute from '@common/modules/router/components/AuthenticatedRoute'
import KeystoreUnlockedRoute from '@common/modules/router/components/KeystoreUnlockedRoute'
import { ROUTES } from '@common/modules/router/constants/common'
import { getInitialRoute } from '@common/modules/router/helpers'
import eventBus from '@common/services/event/eventBus'
import flexbox from '@common/styles/utils/flexbox'
import DashboardScreen from '@mobile/modules/dashboard/screens/DashboardScreen'
import useLedgerBleLifecycle from '@mobile/modules/hardware-wallet/hooks/useLedgerBleLifecycle'
import KeyStoreUnlockScreen from '@mobile/modules/keystore/screens/KeyStoreUnlockScreen'
import MainRoutes from '@mobile/modules/router/components/MainRoutes'
import RequestsBottomSheet from '@mobile/modules/router/components/RequestsBottomSheet'

const Router = () => {
  const { path } = useRoute()
  const pathname = path?.substring(1)
  const { authStatus } = useAuth()
  const keystoreState = useController('KeystoreController').state
  const {
    state: requestsState,
    requestModalRef,
    closeRequestModal,
    onBottomSheetClosed,
    onBottomSheetOpened
  } = useController('RequestsController')
  const swapAndBridgeState = useController('SwapAndBridgeController').state
  const transferState = useController('TransferController').state
  const { areControllerStatesLoaded } = useContext(ControllersStateLoadedContext)
  const { dispatch } = useContext(ControllersMiddlewareContext)
  // Fonts load in parallel with controller boot (the tree mounts before fonts
  // are ready — see AppInit). Gate the splash hide on fonts too so the first
  // painted frame already has the custom fonts applied.
  const { fontsLoaded } = useFonts()

  // Disconnect the Ledger BLE transport when the wallet locks or the app is
  // backgrounded; it transparently reconnects on the next device operation.
  useLedgerBleLifecycle(keystoreState.isUnlocked)

  // Wrap onBottomSheetClosed to emit event for DappWebViewScreen focus
  // Must be at top level before any early returns
  const handleBottomSheetClosed = useCallback(() => {
    onBottomSheetClosed?.()
    // Emit event so DappWebViewScreen can dispatch focus to the WebView
    eventBus.emit('requestsBottomSheet.closed')
  }, [onBottomSheetClosed])

  const splashHidden = useRef(false)

  const isReady = authStatus !== AUTH_STATUS.LOADING && areControllerStatesLoaded && fontsLoaded

  useEffect(() => {
    if (isReady && !splashHidden.current) {
      splashHidden.current = true
      SplashScreen.setOptions({ duration: 200, fade: true })
      SplashScreen.hideAsync().catch(() => {})
      // Now that the splash is hidden, let the webview worker stream the
      // heavy controller states (portfolio, dapps, activity, ...) that were
      // held back during the critical boot phase. Done after the splash hide
      // call so any cost of draining the queue does not delay the first paint.
      dispatch({ type: 'SET_BOOT_PHASE', params: { phase: 'full' } })
    }
  }, [isReady, dispatch])

  // Keep the native splash screen visible until controllers, auth and fonts are ready
  if (!isReady) {
    return null
  }

  // Determine where to navigate initially based on state
  const initialRoute = getInitialRoute({
    keystoreState,
    authStatus,
    requestsState,
    swapAndBridgeState,
    transferState
  })

  return (
    <View style={flexbox.flex1}>
      {initialRoute && !pathname && <Navigate to={initialRoute} replace />}
      <Routes>
        <Route element={<KeystoreUnlockedRoute />}>
          <Route element={<AuthenticatedRoute />}>
            <Route path={ROUTES.dashboard} element={<DashboardScreen />} />
          </Route>
        </Route>
        <Route path={ROUTES.keyStoreUnlock} element={<KeyStoreUnlockScreen />} />
        {/* Fallback route to suppress "No routes matched location" warnings when multiple Routes blocks are rendered */}
        <Route path="*" element={null} />
      </Routes>
      <MainRoutes />

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
