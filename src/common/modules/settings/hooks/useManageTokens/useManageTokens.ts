import { useCallback, useEffect, useMemo, useRef } from 'react'

import { TokenResult } from '@ambire-common/libs/portfolio'
import useController from '@common/hooks/useController'
import { tokenOrCollectionSearch } from '@common/utils/search'
import { networkSort } from '@common/utils/sorting'

export const ALL_NETWORKS_FILTER = 'all'

type Props = {
  search: string
  networkFilter: string
}

type UseManageTokensReturnType = {
  customTokens: TokenResult[]
  hiddenTokens: TokenResult[]
  isLoading: boolean
  onTokenPreferenceOrCustomTokenChange: () => void
}

const useManageTokens = ({ search, networkFilter }: Props): UseManageTokensReturnType => {
  const debouncedPortfolioUpdateInterval = useRef<NodeJS.Timeout | null>(null)
  const { tokenPreferences, customTokens: portfolioCustomTokens } =
    useController('PortfolioController').state
  const { networks } = useController('NetworksController').state
  const { dispatch: mainDispatch } = useController('MainController')
  const {
    state: {
      portfolio: { isAllReady, tokens }
    }
  } = useController('SelectedAccountController')

  const filteredTokens = useMemo(() => {
    const filtered = tokens.filter((token) => {
      const { flags, chainId } = token
      if (flags.onGasTank || !!flags.rewardsType) return false
      const network = networks.find((n) => n.chainId === chainId)

      return networkFilter === ALL_NETWORKS_FILTER || network?.name === networkFilter
    })

    return tokenOrCollectionSearch({ networks, assets: filtered, search })
  }, [networkFilter, networks, search, tokens])

  const sortByNetwork = useCallback(
    (a: TokenResult, b: TokenResult) => {
      const aNetwork = networks.find(({ chainId }) => chainId === a.chainId)
      const bNetwork = networks.find(({ chainId }) => chainId === b.chainId)

      if (!aNetwork || !bNetwork) return 0

      return networkSort(aNetwork, bNetwork, networks)
    },
    [networks]
  )

  const customTokens = useMemo(() => {
    return filteredTokens
      .filter(({ flags, address, chainId }) => {
        const isTokenHidden =
          tokenPreferences.some(
            ({ address: addr, chainId: nId, isHidden }) =>
              addr === address && nId === chainId && isHidden
          ) && flags.isHidden

        const isCustom = flags.isCustom && !isTokenHidden

        if (!isCustom) return false

        const isRemovedOptimistically = !portfolioCustomTokens.some(
          ({ address: addr, chainId: nId }) => addr === address && nId === chainId
        )

        return !isRemovedOptimistically
      })
      .sort(sortByNetwork)
  }, [filteredTokens, portfolioCustomTokens, sortByNetwork, tokenPreferences])

  const hiddenTokens = useMemo(() => {
    return filteredTokens
      .filter(({ flags, address, chainId }) => {
        return (
          tokenPreferences.some(
            ({ address: addr, chainId: nId, isHidden }) =>
              addr === address && nId === chainId && isHidden
          ) && flags.isHidden
        )
      })
      .sort(sortByNetwork)
  }, [filteredTokens, sortByNetwork, tokenPreferences])

  const onTokenPreferenceOrCustomTokenChange = useCallback(() => {
    if (debouncedPortfolioUpdateInterval.current) {
      clearTimeout(debouncedPortfolioUpdateInterval.current)
    }

    debouncedPortfolioUpdateInterval.current = setTimeout(() => {
      mainDispatch({
        type: 'method',
        params: {
          method: 'updateSelectedAccountPortfolio',
          args: []
        }
      })
      debouncedPortfolioUpdateInterval.current = null
    }, 1000)
  }, [mainDispatch])

  useEffect(() => {
    return () => {
      if (debouncedPortfolioUpdateInterval.current) {
        clearTimeout(debouncedPortfolioUpdateInterval.current)
      }
    }
  }, [])

  return {
    customTokens,
    hiddenTokens,
    isLoading: !isAllReady,
    onTokenPreferenceOrCustomTokenChange
  }
}

export default useManageTokens
