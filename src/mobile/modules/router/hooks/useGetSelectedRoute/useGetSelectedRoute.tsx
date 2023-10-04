import { ROUTES } from '@common/modules/router/constants/common'
import { useNavigationState } from '@react-navigation/native'

const defaultRoute: string = ROUTES.dashboard

// non-existent routes are navigator stacks containing the routes that represent an actual screen
// these routes should be replaced with the default route on initial render
// because initially the router doesn't render the whole tree of nested routes
// thus looping through the routes tree ends up in some of those non-existent ones
const nonExistentRoutes: string[] = ['drawer', 'tabs']

const useGetSelectedRoute = () => {
  const state = useNavigationState((s) => s)
  let route = state?.routes?.[state.index]

  while (route.state) {
    route = route.state?.routes?.[route?.state?.index]
  }

  const routeName: string =
    !route.name || nonExistentRoutes.some((r: string) => r === route.name)
      ? defaultRoute
      : route.name

  return {
    key: route.key,
    name: routeName,
    params: route.params
  }
}

export default useGetSelectedRoute
