import { useCallback } from 'react'

import useController from '@common/hooks/useController'

const useDashboardReload = () => {
  const { dispatch: mainDispatch } = useController('MainController')
  const { dashboardNetworkFilter, portfolio } = useController('SelectedAccountController').state

  const reloadAccount = useCallback(() => {
    if (!portfolio.isAllReady || portfolio.isReloading) return

    mainDispatch({
      type: 'method',
      params: {
        method: 'reloadSelectedAccount',
        args: [
          {
            chainIds: dashboardNetworkFilter ? [BigInt(dashboardNetworkFilter)] : undefined,
            isManualReload: true
          }
        ]
      }
    })
  }, [dashboardNetworkFilter, mainDispatch, portfolio.isAllReady, portfolio.isReloading])

  const refreshing = !portfolio.isAllReady || portfolio.isReloading

  return { reloadAccount, refreshing }
}

export default useDashboardReload
