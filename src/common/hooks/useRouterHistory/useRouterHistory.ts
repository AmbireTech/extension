import { useContext } from 'react'
import { Location, NavigationType, UNSAFE_NavigationContext } from 'react-router-native'

/**
 * The history instance behind the router - memory history on mobile, DOM history in
 * the extension. React Router v6 exposes no API for it, but passes it down as the
 * context `navigator`.
 *
 * Gives what the hooks cannot: `location` is the current one without a re-render,
 * `index` is the real stack depth - the only way to tell a push from a pop - and
 * `push`/`replace`/`go` navigate without `useNavigate`, which subscribes to the
 * location and would re-render every screen that can navigate. `index` exists on
 * memory history only, so it must not be relied on outside mobile.
 */
export type RouterHistory = {
  index: number
  action: NavigationType
  location: Location
  push: (to: string, state?: any) => void
  replace: (to: string, state?: any) => void
  go: (delta: number) => void
}

const useRouterHistory = (): RouterHistory => {
  const { navigator } = useContext(UNSAFE_NavigationContext)

  return navigator as unknown as RouterHistory
}

export default useRouterHistory
