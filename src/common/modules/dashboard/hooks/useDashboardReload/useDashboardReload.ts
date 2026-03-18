import { useCallback, useEffect, useState } from 'react'

import useController from '@common/hooks/useController'

const useDashboardReload = () => {
  const { dispatch: mainDispatch } = useController('MainController')
  const { dashboardNetworkFilter, portfolio } = useController('SelectedAccountController').state
  const [isManuallyRefreshing, setIsManuallyRefreshing] = useState(false)

  const reloadAccount = useCallback(() => {
    if (!portfolio.isAllReady || portfolio.isReloading) return

    setIsManuallyRefreshing(true)

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

  useEffect(() => {
    if (!refreshing) {
      setIsManuallyRefreshing(false)
    }
  }, [refreshing])

  return { reloadAccount, refreshing, isManuallyRefreshing }
}

export default useDashboardReload
