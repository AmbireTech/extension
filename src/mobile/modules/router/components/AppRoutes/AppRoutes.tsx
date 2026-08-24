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
 * Every route of the mobile app, rendered for one location. An explicit `location`
 * renders the screens matching it instead of the router's current one, and scopes
 * react-router's `LocationContext` to it - which is what lets a screen stay mounted
 * and keep reading its own params while the router has moved on.
 */
const AppRoutes = ({ location }: { location: Location }) => {
  /**
   * Provided here rather than through `<Routes location>`, which spreads the location
   * into a fresh context object on every render - churning the identity of everything
   * derived from it, `navigate` above all. The stack holds one stable location per
   * card. `Pop` is what react-router reports for an overridden location.
   */
  const scopedLocation = useMemo(
    () => ({ location, navigationType: NavigationType.Pop }),
    [location]
  )

  return (
    <LocationContext.Provider value={scopedLocation}>
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
    </LocationContext.Provider>
  )
}

// Memoized because there is one instance per card: a re-render of the stack must not
// re-run route matching for every mounted location.
export default React.memo(AppRoutes)
