import { useEffect, useMemo, useState } from 'react'

import useRoute from '@common/hooks/useRoute'

const useIsRouteActive = (routePath: string) => {
  const { pathname } = useRoute()
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    setIsActive(pathname.substring(1) === routePath)
  }, [pathname, routePath])

  return isActive
}

export default useIsRouteActive
