import React, { lazy, Suspense, useContext } from 'react'
import { StyleSheet, View } from 'react-native'
import { Route, Routes } from 'react-router-dom'

import Alert from '@common/components/Alert'
import { useTranslation } from '@common/config/localization'
import { ControllersStateLoadedContext } from '@common/contexts/controllersStateLoadedContext'
import useRoute from '@common/hooks/useRoute'
import useTheme from '@common/hooks/useTheme'
import { AUTH_STATUS } from '@common/modules/auth/constants/authStatus'
import useAuth from '@common/modules/auth/hooks/useAuth'
import AuthenticatedRoute from '@common/modules/router/components/AuthenticatedRoute'
import KeystoreUnlockedRoute from '@common/modules/router/components/KeystoreUnlockedRoute'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@common/utils/uiType'
import Splash from '@web/components/Splash'
import { ROUTE_CRITICAL_CONTROLLERS } from '@web/constants/criticalControllers'
import useCurrentActionSideEffects from '@web/hooks/useCurrentActionSideEffects'
import DashboardScreen from '@web/modules/dashboard/screens/DashboardScreen'
import KeyStoreUnlockScreen from '@web/modules/keystore/screens/KeyStoreUnlockScreen'

import getStyles from './styles'

const AsyncMainRoute = lazy(() => import('@web/modules/router/components/MainRoutes'))

const { isPopup } = getUiType()

// The initial route is computed in the background and navigated to via the
// controllers middleware (GET_INITIAL_ROUTE). This component only renders the
// route tree and the loading splash.
const Router = () => {
  const { t } = useTranslation()
  const { styles } = useTheme(getStyles)
  const { path } = useRoute()
  const pathname = path?.substring(1)
  const { authStatus } = useAuth()
  const { areControllerStatesLoaded, isStatesLoadingTakingTooLong } = useContext(
    ControllersStateLoadedContext
  )
  useCurrentActionSideEffects()

  if (isStatesLoadingTakingTooLong && !areControllerStatesLoaded) {
    return (
      <View style={[StyleSheet.absoluteFill, flexbox.center]}>
        <Alert
          type="warning"
          title={t(
            "The initial loading is taking longer than expected. This might be due to a connection issue on your side - or a glitch on ours. If it doesn't resolve soon, please try disabling and re-enabling the extension, or restarting your browser."
          )}
          style={{ maxWidth: 500 }}
        />
      </View>
    )
  }

  if (authStatus === AUTH_STATUS.LOADING || !areControllerStatesLoaded) {
    // Routes in ROUTE_CRITICAL_CONTROLLERS load next to instantly so it doesn't make sense to display
    // a Splash screen for < 200ms. We still need to do it for state persisted screens in the popup (transfer, swap)
    // and all other ui types
    if (isPopup && (Object.keys(ROUTE_CRITICAL_CONTROLLERS).includes(pathname) || !pathname))
      return null

    return <Splash />
  }

  return (
    <View style={styles.container}>
      <Routes>
        <Route element={<KeystoreUnlockedRoute />}>
          <Route element={<AuthenticatedRoute />}>
            <Route path={WEB_ROUTES.dashboard} element={<DashboardScreen />} />
          </Route>
        </Route>
        <Route path={WEB_ROUTES.keyStoreUnlock} element={<KeyStoreUnlockScreen />} />
      </Routes>
      <Suspense fallback={null}>
        <AsyncMainRoute />
      </Suspense>
    </View>
  )
}

export default Router
