import { useMemo } from 'react'

import { UserRequest } from '@ambire-common/interfaces/userRequest'
import { getDappIdFromUrl } from '@ambire-common/libs/dapps/helpers'
import useDappsControllerState from '@web/hooks/useDappsControllerState'

interface DappInfo {
  name: string
  icon: string
}

/**
 * Hook to extract dapp name and icon from predefined dapp metadata with
 * fallback to getting it from the userRequest session data.
 */
const useDappInfo = (userRequest?: UserRequest): DappInfo => {
  const {
    state: { dapps }
  } = useDappsControllerState()

  return useMemo(() => {
    // Find predefined dapp metadata if available
    const dappRefFromController = dapps.find(
      (d) => getDappIdFromUrl(d.url) === userRequest?.session?.id
    )

    // Prefer predefined dapp metadata, fallback to session data
    const name = dappRefFromController?.name || userRequest?.session?.name || ''
    const icon = dappRefFromController?.icon || userRequest?.session?.icon || ''

    return { name, icon }
  }, [userRequest?.session?.id, userRequest?.session?.name, userRequest?.session?.icon, dapps])
}

export default useDappInfo
