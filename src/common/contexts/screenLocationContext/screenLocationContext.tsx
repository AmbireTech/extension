import React, { createContext, useContext, useMemo } from 'react'
import { Location, useLocation } from 'react-router-native'

import useRouterHistory from '@common/hooks/useRouterHistory'

export type ScreenLocation = {
  /** The location of the screen the subtree belongs to. */
  location: Location
  /** Whether there is a screen underneath this one to go back to. */
  canGoBack: boolean
}

const ScreenLocationContext = createContext<ScreenLocation | null>(null)

/**
 * Pins its subtree to one screen's location. The mobile stack keeps every screen the
 * user came through mounted, so a screen has to read its own location rather than the
 * router's current one - otherwise a navigation somewhere else re-renders it, and
 * `useLocation` (which `useNavigate` reads too) does exactly that to all of them.
 */
const ScreenLocationProvider = ({
  location,
  canGoBack,
  children
}: ScreenLocation & { children: React.ReactNode }) => {
  const value = useMemo(() => ({ location, canGoBack }), [location, canGoBack])

  return <ScreenLocationContext.Provider value={value}>{children}</ScreenLocationContext.Provider>
}

/**
 * The router's current location, for everything rendered outside the screens - the
 * providers above the stack, the global overlays. This is the one place that
 * subscribes to it, and it hands the same `children` element back on every
 * navigation, so nothing below re-renders for it except what reads the location.
 */
const LiveScreenLocationProvider = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation()
  const history = useRouterHistory()

  return (
    <ScreenLocationProvider location={location} canGoBack={history.index > 0}>
      {children}
    </ScreenLocationProvider>
  )
}

/** The location of the screen the caller is on, or the router's own when outside one. */
const useScreenLocation = () => useContext(ScreenLocationContext)

export { LiveScreenLocationProvider, ScreenLocationProvider, useScreenLocation }
