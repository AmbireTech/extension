import { useMemo } from 'react'

import { CustomToken } from '@ambire-common/libs/portfolio/customToken'
import { TokenResult } from '@ambire-common/libs/portfolio/interfaces'
import useController from '@common/hooks/useController'
import useDebouncedPortfolioUpdate from '@common/hooks/useDebouncedPortfolioUpdate'

import { ALL_NETWORKS_FILTER, composeAssetLists } from './composeAssetLists'

export { ALL_NETWORKS_FILTER }

type Props = {
  search: string
  networkFilter: string
  standard: CustomToken['standard']
}

type UseManageAssetsReturnType<T> = {
  customAssets: T[]
  hiddenAssets: T[]
  isLoading: boolean
  onAssetPreferenceChange: () => void
}

/** The custom and the hidden assets of a standard, see `composeAssetLists` */
const useManageAssets = <T extends TokenResult>({
  search,
  networkFilter,
  standard
}: Props): UseManageAssetsReturnType<T> => {
  const onAssetPreferenceChange = useDebouncedPortfolioUpdate()
  const { tokenPreferences, customTokens } = useController('PortfolioController').state
  const { networks } = useController('NetworksController').state
  const {
    state: {
      portfolio: { isAllReady, tokens, collections }
    }
  } = useController('SelectedAccountController')

  const { customAssets, hiddenAssets } = useMemo(
    () =>
      composeAssetLists<T>({
        standard,
        customTokens,
        tokenPreferences,
        portfolioTokens: tokens,
        portfolioCollections: collections,
        networks,
        networkFilter,
        search
      }),
    [collections, customTokens, networkFilter, networks, search, standard, tokenPreferences, tokens]
  )

  return {
    customAssets,
    hiddenAssets,
    // The lists come from the stored state, so they only wait for the portfolio
    // when there is nothing to display yet
    isLoading: !isAllReady && !customAssets.length && !hiddenAssets.length,
    onAssetPreferenceChange
  }
}

export default useManageAssets
