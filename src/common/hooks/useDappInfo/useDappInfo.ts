import { useMemo } from 'react'

import { UserRequest } from '@ambire-common/interfaces/userRequest'
import useLoadableDappIcon from '@common/hooks/useLoadableDappIcon'

interface DappInfo {
  name: string
  icon: string
}

/**
 * Hook to extract dapp name and icon the userRequest session data. The icon is left empty when it
 * can't be loaded without a request to a host other than the site (see `canLoadDappIcon`).
 */
const useDappInfo = (userRequest?: UserRequest): DappInfo => {
  const session = userRequest?.dappPromises[0]?.session
  const icon = useLoadableDappIcon({ icon: session?.icon, siteUrl: session?.origin })

  return useMemo(() => ({ name: session?.name || '', icon }), [session?.name, icon])
}

export default useDappInfo
