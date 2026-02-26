import React, { Suspense, useContext } from 'react'
import { StyleSheet, View } from 'react-native'
import { Navigate, Route, Routes } from 'react-router-native'

import { ControllersStateLoadedContext } from '@common/contexts/controllersStateLoadedContext'
import useController from '@common/hooks/useController'
import useRoute from '@common/hooks/useRoute'
import { AUTH_STATUS } from '@common/modules/auth/constants/authStatus'
import useAuth from '@common/modules/auth/hooks/useAuth'
import { ROUTES } from '@common/modules/router/constants/common'
import flexbox from '@common/styles/utils/flexbox'
import Splash from '@mobile/components/Splash'
import DashboardScreen from '@mobile/modules/dashboard/screens/DashboardScreen'
import KeyStoreUnlockScreen from '@mobile/modules/keystore/screens/KeyStoreUnlockScreen'
import AuthenticatedRoute from '@mobile/modules/router/components/AuthenticatedRoute'
import KeystoreUnlockedRoute from '@mobile/modules/router/components/KeystoreUnlockedRoute'
import MainRoutes from '@mobile/modules/router/components/MainRoutes'
import { getInitialRoute } from '@mobile/modules/router/helpers'

const Router = () => {
  const { path } = useRoute()
  const pathname = path?.substring(1)
  const { authStatus } = useAuth()
  const keystoreState = useController('KeystoreController').state
  const { areControllerStatesLoaded } = useContext(ControllersStateLoadedContext)

  console.log('Router', {
    authStatus,
    areControllerStatesLoaded
  })

  // Wait for controllers and auth status
  if (authStatus === AUTH_STATUS.LOADING || !areControllerStatesLoaded) {
    return <Splash />
  }

  // Determine where to navigate initially based on state
  const initialRoute = getInitialRoute({
    keystoreState,
    authStatus
  })

  // We could add path tracking state here later if needed
  // For now just route according to standard NativeRouter behaviour
  // The Navigate below helps direct the user appropriately when they open the app

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
      <Suspense fallback={<Splash />}>
        <MainRoutes />
      </Suspense>
    </View>
  )
}

export default Router
