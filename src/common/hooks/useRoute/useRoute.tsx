import { useMemo } from 'react'
import { useLocation } from 'react-router-native'

import { UseRouteReturnType } from './types'

function getSearchParamsAsObject(searchString: string) {
  const paramsObject: any = {}
  const searchParams = new URLSearchParams(searchString)

  // eslint-disable-next-line no-restricted-syntax
  for (const [key, value] of searchParams.entries()) {
    paramsObject[key] = value
  }

  return paramsObject
}

const useRoute = (): UseRouteReturnType => {
  const route = useLocation()

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
