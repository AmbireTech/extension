import { navigationRef } from '@common/services/navigation'

import { UseRouteReturnType } from './types'

const useRoute = (): UseRouteReturnType => {
  // Initially getCurrentRoute will return undefined until the current stack doesn't change
  // when the stack is changed it will be stored in the routes indexes and then the route object will be accessible
  const route = navigationRef.current.getCurrentRoute()

  return {
    ...route,
    params: route?.params || {},
    path: route?.name
  }
}

export default useRoute
