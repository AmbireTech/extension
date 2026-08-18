import { useContext } from 'react'
import { Location, NavigationType, UNSAFE_NavigationContext } from 'react-router-native'

/**
 * The memory history instance backing `NativeRouter` (which is react-router's
 * `MemoryRouter`). React Router v6 has no public API for it, but `MemoryRouter`
 * passes the instance down as the context `navigator`, and memory history
 * exposes the index of the current entry - the only reliable way to know the
 * real stack depth and to tell a push from a pop.
 */
export type MemoryHistory = {
  index: number
  action: NavigationType
  location: Location
}

const useMemoryHistory = (): MemoryHistory => {
  const { navigator } = useContext(UNSAFE_NavigationContext)

  return navigator as unknown as MemoryHistory
}

export default useMemoryHistory
