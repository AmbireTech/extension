import React, { useMemo } from 'react'
import {
  Location,
  NavigationType,
  Route,
  Routes,
  UNSAFE_LocationContext as LocationContext
} from 'react-router-native'

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
  /**
   * The scoped location is provided here rather than through `<Routes location>`,
   * which rebuilds the location object on every render (react-router spreads it
   * into the context it provides). That would churn the identity of everything
   * derived from it - `navigate` above all - and re-run every effect that depends
   * on it, on every render. The stack already holds one stable location per card.
   * `Pop` matches what react-router reports for an overridden location.
   */
  const scopedLocation = useMemo(
    () => (location ? { location, navigationType: NavigationType.Pop } : null),
    [location]
  )

  const routes = (
    <>
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
    </>
  )

  if (!scopedLocation) return routes

  return <LocationContext.Provider value={scopedLocation}>{routes}</LocationContext.Provider>
}

// Memoized because the stack renders one instance per card: a re-render of the
// stack must not re-run route matching for every mounted location.
export default React.memo(AppRoutes)
