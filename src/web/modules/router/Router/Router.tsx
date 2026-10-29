import React, { lazy, Suspense, useContext, useEffect, useState } from 'react'
import { View } from 'react-native'
import { Route, Routes } from 'react-router-dom'

import { useTranslation } from '@common/config/localization'
import { ControllersStateLoadedContext } from '@common/contexts/controllersStateLoadedContext'
import { selectSidePanelModeStatus } from '@common/controllers/wallet-state/selectors'
import useController from '@common/hooks/useController'
import useRoute from '@common/hooks/useRoute'
import useTheme from '@common/hooks/useTheme'
import { AUTH_STATUS } from '@common/modules/auth/constants/authStatus'
import useAuth from '@common/modules/auth/hooks/useAuth'
import AuthenticatedRoute from '@common/modules/router/components/AuthenticatedRoute'
import KeystoreUnlockedRoute from '@common/modules/router/components/KeystoreUnlockedRoute'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import { getUiType } from '@common/utils/uiType'
import RecoveryScreen from '@web/components/RecoveryScreen'
import Splash from '@web/components/Splash'
import { ROUTE_CRITICAL_CONTROLLERS } from '@web/constants/criticalControllers'
import useCurrentActionSideEffects from '@web/hooks/useCurrentActionSideEffects'
import usePersistSidePanelLayout from '@web/hooks/usePersistSidePanelLayout'
import useSidePanelActionRequestRouting from '@web/hooks/useSidePanelActionRequestRouting'
import SidePanelModeDisabledScreen from '@web/modules/auth/screens/SidePanelModeDisabledScreen'
import DashboardScreen from '@web/modules/dashboard/screens/DashboardScreen'
import KeyStoreUnlockScreen from '@web/modules/keystore/screens/KeyStoreUnlockScreen'

import getStyles from './styles'

const AsyncMainRoute = lazy(() => import('@web/modules/router/components/MainRoutes'))

const { isPopup, isFirefoxSidebar } = getUiType()

const TIME_TO_LAND_ON_A_ROUTE = 3000

// Where a view belongs is decided by the background, which sends it the route (applied by
// the controllers middleware). This component only renders the route tree, the loading
// splash, and the screens the user is offered when neither can happen.
const Router = () => {
  const { t } = useTranslation()
  const { styles } = useTheme(getStyles)
  const { path } = useRoute()
  const pathname = path?.substring(1)
  const { authStatus } = useAuth()
  const { canRenderRoute, areAllControllerStatesLoaded, isStatesLoadingTakingTooLong } = useContext(
    ControllersStateLoadedContext
  )
  const { state: sidePanelModeStatus } = useController(
    'WalletStateController',
    selectSidePanelModeStatus
  )
  useCurrentActionSideEffects()
  useSidePanelActionRequestRouting()
  usePersistSidePanelLayout()

  // Controller state is received but the extension hasn't routed anywhere
  const hasNothingToRender = !pathname && areAllControllerStatesLoaded
  const [isWaitingForRouteForTooLong, setIsWaitingForRouteForTooLong] = useState(false)

  useEffect(() => {
    if (!hasNothingToRender) {
      if (isWaitingForRouteForTooLong) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsWaitingForRouteForTooLong(false)
      }

      return
    }

    const timeout = setTimeout(() => setIsWaitingForRouteForTooLong(true), TIME_TO_LAND_ON_A_ROUTE)

    return () => clearTimeout(timeout)
  }, [hasNothingToRender, isWaitingForRouteForTooLong])

  // Gated on all the controllers and not on `canRenderRoute`, because a route can
  // already be on screen (the dashboard shell) while a deferred controller never
  // reports its state. Otherwise the warning would be unreachable and the user would
  // sit on an animating skeleton forever.
  if (isStatesLoadingTakingTooLong && !areAllControllerStatesLoaded) {
    return (
      <RecoveryScreen
        title={t('Loading failed')}
        description={t(
          "We couldn't start the extension properly. Try what you were doing again, or if that doesn't help, disable and re-enable the extension or restart your browser."
        )}
      />
    )
  }

  if (hasNothingToRender && isWaitingForRouteForTooLong) {
    return (
      <RecoveryScreen
        title={t("This screen didn't load")}
        description={t(
          'Your funds are safe. Reload, disable and re-enable the extension, or restart your browser to fix this.'
        )}
      />
    )
  }

  // Render quickly only the routes that are adjusted for this (to prevent errors from missing ctrl state)
  const isRouteWithCriticalControllers = Object.keys(ROUTE_CRITICAL_CONTROLLERS).includes(pathname)
  const canRenderCurrentRoute =
    areAllControllerStatesLoaded || (isRouteWithCriticalControllers && canRenderRoute)

  // Firefox can't hide the extension's sidebar from its sidebar switcher, so it can be opened
  // while the wallet is set to open as a popup - show a notice there instead of a second wallet UI.
  // The mode reads as off until the stored settings load, so the splash is kept until then -
  // otherwise the notice could flash before the wallet, or the wallet before the notice.
  if (isFirefoxSidebar && sidePanelModeStatus !== 'on') {
    return sidePanelModeStatus === 'off' ? <SidePanelModeDisabledScreen /> : <Splash />
  }

  if (authStatus === AUTH_STATUS.LOADING || !canRenderCurrentRoute) {
    // Routes in ROUTE_CRITICAL_CONTROLLERS load next to instantly so it doesn't make sense to display
    // a Splash screen for < 200ms. We still need to do it for state persisted screens in the popup (transfer, swap)
    // and all other ui types
    if (isPopup && (isRouteWithCriticalControllers || !pathname)) return null

    return <Splash />
  }

  return (
    // The page that `backdrop-style.css` blurs behind an open bottom sheet
    <View style={styles.container} dataSet={{ blurredBehindSheets: true }}>
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
