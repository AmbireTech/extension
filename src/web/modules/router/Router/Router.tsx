import React, { lazy, Suspense, useContext } from 'react'
import { StyleSheet, View } from 'react-native'
import { Route, Routes } from 'react-router-dom'

import Alert from '@common/components/Alert'
import Spinner from '@common/components/Spinner'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import { AUTH_STATUS } from '@common/modules/auth/constants/authStatus'
import useAuth from '@common/modules/auth/hooks/useAuth'
import DashboardScreen from '@common/modules/dashboard/screens'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import flexbox from '@common/styles/utils/flexbox'
import Splash from '@web/components/Splash'
import { ControllersStateLoadedContext } from '@web/contexts/controllersStateLoadedContext'
import KeyStoreUnlockScreen from '@web/modules/keystore/screens/KeyStoreUnlockScreen'
import AuthenticatedRoute from '@web/modules/router/components/AuthenticatedRoute'
import KeystoreUnlockedRoute from '@web/modules/router/components/KeystoreUnlockedRoute'
import SortHat from '@web/modules/router/components/SortHat'

import getStyles from './styles'

const AsyncMainRoute = lazy(() => import('@web/modules/router/components/MainRoutes'))

const Router = () => {
  const { t } = useTranslation()
  const { authStatus } = useAuth()
  const { styles } = useTheme(getStyles)
  const { areControllerStatesLoaded, isStatesLoadingTakingTooLong } = useContext(
    ControllersStateLoadedContext
  )

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
        <Route index path="/" element={<SortHat />} />
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
