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
    if (!userRequest) return { name: '', icon: '' }

    const session = userRequest.dappPromises[0]?.session
    const name = session?.name || ''
    const icon = session?.icon || ''

    return { name, icon }
  }, [userRequest])
}

export default useDappInfo
