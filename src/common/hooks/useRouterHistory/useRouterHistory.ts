import { useContext } from 'react'
import { Location, NavigationType, UNSAFE_NavigationContext } from 'react-router-native'

/**
 * The history instance backing the router: memory history on mobile (where
 * `NativeRouter` is react-router's `MemoryRouter`), the DOM history in the
 * extension. React Router v6 has no public API for it, but every router passes
 * the instance down as the context `navigator`.
 *
 * Useful for two things the hooks cannot give: `location` is always the current
 * one, with no dependency on a re-render, and `index` is the real stack depth -
 * the only reliable way to tell a push from a pop. `index` exists on memory
 * history only, so it must not be relied on outside mobile.
 */
export type RouterHistory = {
  index: number
  action: NavigationType
  location: Location
}

const useRouterHistory = (): RouterHistory => {
  const { navigator } = useContext(UNSAFE_NavigationContext)

  return navigator as unknown as RouterHistory
}

export default useRouterHistory
