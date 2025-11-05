import { useMemo } from 'react'

import { UserRequest } from '@ambire-common/interfaces/userRequest'

interface DappInfo {
  name: string
  icon: string
}

/**
 * Hook to extract dapp name and icon the userRequest session data.
 */
const useDappInfo = (userRequest?: UserRequest): DappInfo => {
  return useMemo(() => {
    const name = userRequest?.session?.name || ''
    const icon = userRequest?.session?.icon || ''

    return { name, icon }
  }, [userRequest?.session?.name, userRequest?.session?.icon])
}

export default useDappInfo
