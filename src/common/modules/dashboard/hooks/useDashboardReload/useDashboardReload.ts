import { useCallback, useEffect, useState } from 'react'

import useController from '@common/hooks/useController'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectPortfolioIsAllReady = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.portfolio?.isAllReady
const selectPortfolioIsReloading = (
  state: AllControllersMappingType['SelectedAccountController']
) => state.portfolio?.isReloading

const selectDashboardNetworkFilter = (
  state: AllControllersMappingType['SelectedAccountController']
) => state.dashboardNetworkFilter

const useDashboardReload = () => {
  const { dispatch: mainDispatch } = useController('MainController')
  const { state: dashboardNetworkFilter } = useController(
    'SelectedAccountController',
    selectDashboardNetworkFilter
  )
  const { state: isPortfolioAllReady } = useController(
    'SelectedAccountController',
    selectPortfolioIsAllReady
  )
  const { state: isPortfolioReloading } = useController(
    'SelectedAccountController',
    selectPortfolioIsReloading
  )
  const [isManuallyRefreshing, setIsManuallyRefreshing] = useState(false)

  const reloadAccount = useCallback(() => {
    if (!isPortfolioAllReady || isPortfolioReloading) return

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
  }, [dashboardNetworkFilter, mainDispatch, isPortfolioAllReady, isPortfolioReloading])

  const refreshing = !isPortfolioAllReady || isPortfolioReloading

  useEffect(() => {
    if (!refreshing) {
      setIsManuallyRefreshing(false)
    }
  }, [refreshing])

  return { reloadAccount, refreshing, isManuallyRefreshing }
}

export default useDashboardReload
