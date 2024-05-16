import React, { lazy, Suspense, useContext } from 'react'
import { StyleSheet, View } from 'react-native'
import { Route, Routes } from 'react-router-dom'

import Alert from '@common/components/Alert'
import Spinner from '@common/components/Spinner'
import { useTranslation } from '@common/config/localization'
import { AUTH_STATUS } from '@common/modules/auth/constants/authStatus'
import useAuth from '@common/modules/auth/hooks/useAuth'
import DashboardScreen from '@common/modules/dashboard/screens'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import flexbox from '@common/styles/utils/flexbox'
import { POPUP_WIDTH } from '@web/constants/spacings'
import { ControllersStateLoadedContext } from '@web/contexts/controllersStateLoadedContext'
import InviteVerifyScreen from '@web/modules/invite/screens/InviteVerifyScreen'
import KeyStoreUnlockScreen from '@web/modules/keystore/screens/KeyStoreUnlockScreen'
import InviteVerifiedRoute from '@web/modules/router/components/InviteVerifiedRoute'
import PrivateRoute from '@web/modules/router/components/PrivateRoute'
import SortHat from '@web/modules/router/components/SortHat'
import TabOnlyRoute from '@web/modules/router/components/TabOnlyRoute'
import { getUiType } from '@web/utils/uiType'

const AsyncMainRoute = lazy(() => import('@web/modules/router/components/MainRoutes'))

const isPopup = getUiType().isPopup

const Router = () => {
  const { t } = useTranslation()
  const { authStatus } = useAuth()
  const { areControllerStatesLoaded, isStatesLoadingTakingTooLong } = useContext(
    ControllersStateLoadedContext
  )

  if (isStatesLoadingTakingTooLong && !areControllerStatesLoaded) {
    return (
      <View style={[StyleSheet.absoluteFill, flexbox.center]}>
        <Alert
          type="warning"
          title={t(
            'Initial loading is taking an unexpectedly long time. Could be caused by connectivity issues on your end. Or a glitch on our. If nothing else helps, please try reloading or reopening the extension.'
          )}
          style={{ maxWidth: 500 }}
        />
      </View>
    )
  }

  if (authStatus === AUTH_STATUS.LOADING || !areControllerStatesLoaded) {
    return (
      <View style={[StyleSheet.absoluteFill, flexbox.center]}>
        <Spinner />
      </View>
    )
  }

  return (
    <View style={[flexbox.flex1, isPopup && { maxWidth: POPUP_WIDTH }]}>
      <Routes>
        <Route index path="/" element={<SortHat />} />
        <Route element={<InviteVerifiedRoute />}>
          <Route element={<PrivateRoute />}>
            <Route path={WEB_ROUTES.dashboard} element={<DashboardScreen />} />
          </Route>
        </Route>
        <Route path={WEB_ROUTES.keyStoreUnlock} element={<KeyStoreUnlockScreen />} />
        <Route element={<TabOnlyRoute />}>
          <Route path={WEB_ROUTES.inviteVerify} element={<InviteVerifyScreen />} />
        </Route>
      </Routes>
      <Suspense fallback={null}>
        <AsyncMainRoute />
      </Suspense>
    </View>
  )
}

export default Router
