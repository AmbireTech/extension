import { useMemo } from 'react'

import { useScreenLocation } from '@common/contexts/screenLocationContext'
import useRouterHistory from '@common/hooks/useRouterHistory'

import { UseRouteReturnType } from './types'

function getSearchParamsAsObject(searchString: string) {
  const paramsObject: any = {}
  const searchParams = new URLSearchParams(searchString)

  for (const [key, value] of searchParams.entries()) {
    paramsObject[key] = value
  }

  return paramsObject
}

/**
 * The route of the screen the caller is on. Deliberately the screen's own route and
 * not the router's current one: the screens the user came through stay mounted, so
 * reading the router's would re-render all of them on every navigation. Outside the
 * screens it is the router's current route (see `LiveScreenLocationProvider`).
 */
const useRoute = (): UseRouteReturnType => {
  const screenLocation = useScreenLocation()
  const history = useRouterHistory()
  // Only reached before the providers are up, where the history is what there is.
  const route = screenLocation?.location || history.location

  const params = useMemo(() => {
    return (route.state as any) || getSearchParamsAsObject(route.search) || {}
  }, [route.state, route.search])

  return useMemo(
    () => ({
      ...route,
      params,
      path: route.pathname
    }),
    [route, params]
  )
}

export default useRoute
