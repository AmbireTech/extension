import { useLocation, useSearchParams } from 'react-router-dom'

import { UseRouteReturnType } from './types'

function getSearchParamsAsObject(searchParams: URLSearchParams) {
  const paramsObject: any = {}

  for (const [key, value] of searchParams.entries()) {
    paramsObject[key] = value
  }

  return paramsObject
}

const useRoute = (): UseRouteReturnType => {
  const route = useLocation()
  const [searchParams] = useSearchParams()

  return {
    ...route,
    params: route.state || getSearchParamsAsObject(searchParams) || {},
    path: route.pathname
  }
}

export default useRoute
