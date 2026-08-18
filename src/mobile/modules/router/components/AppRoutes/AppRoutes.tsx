import React from 'react'
import { Location, Route, Routes } from 'react-router-native'

import AuthenticatedRoute from '@common/modules/router/components/AuthenticatedRoute'
import KeystoreUnlockedRoute from '@common/modules/router/components/KeystoreUnlockedRoute'
import { ROUTES } from '@common/modules/router/constants/common'
import DashboardScreen from '@mobile/modules/dashboard/screens/DashboardScreen'
import KeyStoreUnlockScreen from '@mobile/modules/keystore/screens/KeyStoreUnlockScreen'
import MainRoutes from '@mobile/modules/router/components/MainRoutes'

/**
 * Every route of the mobile app, rendered for one location. Passing an explicit
 * `location` renders the screens matching it instead of the router's current
 * one - and scopes react-router's `LocationContext` to that location - which is
 * what allows an outgoing screen to stay mounted and keep reading its own
 * params while a transition to the next screen plays.
 */
const AppRoutes = ({ location }: { location?: Location }) => {
  return (
    <>
      <Routes location={location}>
        <Route element={<KeystoreUnlockedRoute />}>
          <Route element={<AuthenticatedRoute />}>
            <Route path={ROUTES.dashboard} element={<DashboardScreen />} />
          </Route>
        </Route>
        <Route path={ROUTES.keyStoreUnlock} element={<KeyStoreUnlockScreen />} />
        {/* Fallback route to suppress "No routes matched location" warnings when multiple Routes blocks are rendered */}
        <Route path="*" element={null} />
      </Routes>
      <MainRoutes location={location} />
    </>
  )
}

// Memoized because the stack renders one instance per card: a re-render of the
// stack must not re-run route matching for every mounted location.
export default React.memo(AppRoutes)
