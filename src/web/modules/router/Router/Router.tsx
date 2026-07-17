import React, { lazy, Suspense, useContext, useEffect, useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { Route, Routes } from 'react-router-dom'

import Alert from '@common/components/Alert'
import { useTranslation } from '@common/config/localization'
import { ControllersStateLoadedContext } from '@common/contexts/controllersStateLoadedContext'
import useController from '@common/hooks/useController'
import useNavigation from '@common/hooks/useNavigation'
import useRoute from '@common/hooks/useRoute'
import useTheme from '@common/hooks/useTheme'
import { AUTH_STATUS } from '@common/modules/auth/constants/authStatus'
import useAuth from '@common/modules/auth/hooks/useAuth'
import AuthenticatedRoute from '@common/modules/router/components/AuthenticatedRoute'
import KeystoreUnlockedRoute from '@common/modules/router/components/KeystoreUnlockedRoute'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import { getInitialRoute } from '@common/modules/router/helpers'
import flexbox from '@common/styles/utils/flexbox'
import Splash from '@web/components/Splash'
import useCurrentActionSideEffects from '@web/hooks/useCurrentActionSideEffects'
import DashboardScreen from '@web/modules/dashboard/screens/DashboardScreen'
import KeyStoreUnlockScreen from '@web/modules/keystore/screens/KeyStoreUnlockScreen'

import getStyles from './styles'

const AsyncMainRoute = lazy(() => import('@web/modules/router/components/MainRoutes'))

const Router = () => {
  const { t } = useTranslation()
  const { styles } = useTheme(getStyles)
  const { path } = useRoute()
  const pathname = path?.substring(1)
  const { authStatus } = useAuth()
  const { navigate } = useNavigation()
  const keystoreState = useController('KeystoreController').state
  const requestsState = useController('RequestsController').state
  const swapAndBridgeState = useController('SwapAndBridgeController').state
  const transferState = useController('TransferController').state
  const surveyState = useController('SurveyController').state
  const { areControllerStatesLoaded, isStatesLoadingTakingTooLong } = useContext(
    ControllersStateLoadedContext
  )
  useCurrentActionSideEffects()

  // Guard against running `getInitialRoute` on empty state before controllers load.
  const initialRoute = useMemo(() => {
    if (authStatus === AUTH_STATUS.LOADING || !areControllerStatesLoaded) return null

    return getInitialRoute({
      keystoreState,
      authStatus,
      requestsState,
      swapAndBridgeState,
      transferState,
      surveyState
    })
  }, [
    authStatus,
    areControllerStatesLoaded,
    keystoreState,
    requestsState,
    swapAndBridgeState,
    transferState,
    surveyState
  ])

  // Redirect from an effect, not <Navigate>. The request-window reset in
  // `useRequestsControllerHelpers` can bounce the URL back to `/` right after a redirect,
  // and <Navigate> would never fire again (because it's one shot).
  useEffect(() => {
    if (initialRoute && !pathname) navigate(initialRoute, { replace: true })
  }, [initialRoute, pathname, navigate, requestsState])

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
