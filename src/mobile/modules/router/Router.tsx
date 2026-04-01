import * as SplashScreen from 'expo-splash-screen'
import React, { Suspense, useContext, useEffect, useRef } from 'react'
import { View } from 'react-native'
import { Navigate, Route, Routes } from 'react-router-native'

import { ControllersStateLoadedContext } from '@common/contexts/controllersStateLoadedContext'
import useController from '@common/hooks/useController'
import useRoute from '@common/hooks/useRoute'
import { AUTH_STATUS } from '@common/modules/auth/constants/authStatus'
import useAuth from '@common/modules/auth/hooks/useAuth'
import AuthenticatedRoute from '@common/modules/router/components/AuthenticatedRoute'
import KeystoreUnlockedRoute from '@common/modules/router/components/KeystoreUnlockedRoute'
import { ROUTES } from '@common/modules/router/constants/common'
import { getInitialRoute } from '@common/modules/router/helpers'
import flexbox from '@common/styles/utils/flexbox'
import DashboardScreen from '@mobile/modules/dashboard/screens/DashboardScreen'
import KeyStoreUnlockScreen from '@mobile/modules/keystore/screens/KeyStoreUnlockScreen'
import MainRoutes from '@mobile/modules/router/components/MainRoutes'

const Router = () => {
  const { path } = useRoute()
  const pathname = path?.substring(1)
  const { authStatus } = useAuth()
  const keystoreState = useController('KeystoreController').state
  const requestsState = useController('RequestsController').state
  const swapAndBridgeState = useController('SwapAndBridgeController').state
  const transferState = useController('TransferController').state
  const { areControllerStatesLoaded } = useContext(ControllersStateLoadedContext)
  const splashHidden = useRef(false)

  const isReady = authStatus !== AUTH_STATUS.LOADING && areControllerStatesLoaded

  useEffect(() => {
    if (isReady && !splashHidden.current) {
      splashHidden.current = true
      SplashScreen.setOptions({ duration: 200, fade: true })
      SplashScreen.hideAsync().catch(() => {})
    }
  }, [isReady])

  // Keep the native splash screen visible until controllers and auth are ready
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
      <Suspense fallback={null}>
        <MainRoutes />
      </Suspense>
    </View>
  )
}

export default Router
