import { useMemo } from 'react'

import { Network } from '@ambire-common/interfaces/network'
import {
  CustomToken,
  getAssetPreferenceId,
  TokenPreference
} from '@ambire-common/libs/portfolio/customToken'
import { getAssetCacheKey } from '@ambire-common/libs/portfolio/helpers'
import {
  CollectionResult,
  PortfolioAsset,
  TokenResult
} from '@ambire-common/libs/portfolio/interfaces'
import useController from '@common/hooks/useController'
import { tokenOrCollectionSearch } from '@common/utils/search'
import { networkSort } from '@common/utils/sorting'

export const ALL_NETWORKS_FILTER = 'all'

// Collections are counted in whole items, unlike tokens
const PLACEHOLDER_DECIMALS = { ERC20: 0, ERC721: 1 }

type StoredAsset = { address: string; chainId: bigint; tokenId?: bigint }

/** A collectible is listed on its own, so it carries the id it was stored with */
export type ManagedAsset<T extends PortfolioAsset = TokenResult> = T & { tokenId?: bigint }

type Params = {
  standard: CustomToken['standard']
  customTokens: CustomToken[]
  tokenPreferences: TokenPreference[]
  portfolioTokens: TokenResult[]
  portfolioCollections: CollectionResult[]
  networks: Network[]
  networkFilter: string
  search: string
}

/**
 * A stand-in for an asset the portfolio has no entry for, so that it can still
 * be removed or unhidden.
 */
const getPlaceholderAsset = (
  address: string,
  chainId: bigint,
  standard: CustomToken['standard'],
  isCustom: boolean
): TokenResult & CollectionResult => ({
  address,
  chainId,
  name: '',
  symbol: '',
  decimals: PLACEHOLDER_DECIMALS[standard],
  amount: 0n,
  collectibles: [],
  priceIn: [],
  marketDataIn: [],
  flags: {
    onGasTank: false,
    rewardsType: null,
    canTopUpGasTank: false,
    isFeeToken: false,
    suspectedType: null,
    isCustom
  }
})

/**
 * The custom and the hidden assets of a standard, built from the stored records
 * and enriched with the portfolio's data when it has any.
 */
const composeAssetLists = <T extends PortfolioAsset>({
  standard,
  customTokens,
  tokenPreferences,
  portfolioTokens,
  portfolioCollections,
  networks,
  networkFilter,
  search
}: Params): { customAssets: ManagedAsset<T>[]; hiddenAssets: ManagedAsset<T>[] } => {
  const isCollection = standard === 'ERC721'
  const portfolioAssetsByKey: { [key: string]: PortfolioAsset } = {}

  ;(isCollection ? portfolioCollections : portfolioTokens).forEach((asset) => {
    // Rewards and gas tank entries duplicate an address that is already listed
    const isToken = !('collectibles' in asset)

    if (isToken && (asset.flags.onGasTank || !!asset.flags.rewardsType)) return

    portfolioAssetsByKey[getAssetCacheKey(asset.address, asset.chainId)] = asset
  })

  const collectionKeys = new Set(
    portfolioCollections.map(({ address, chainId }) => getAssetCacheKey(address, chainId))
  )

  const isOfStandard = ({ standard: assetStandard, address, chainId }: TokenPreference) => {
    if (assetStandard) return assetStandard === standard

    // Preferences stored before the standard was recorded have none, so they are
    // tokens, unless the portfolio knows the address as a collection
    const isKnownCollection = collectionKeys.has(getAssetCacheKey(address, chainId))

    return isCollection ? isKnownCollection : !isKnownCollection
  }

  const sortByNetwork = (a: PortfolioAsset, b: PortfolioAsset) => {
    const aNetwork = networks.find(({ chainId }) => chainId === a.chainId)
    const bNetwork = networks.find(({ chainId }) => chainId === b.chainId)

    if (!aNetwork || !bNetwork) return 0

    return networkSort(aNetwork, bNetwork, networks)
  }

  const toDisplayedAssets = (storedAssets: StoredAsset[], areCustom: boolean) => {
    const assets = storedAssets
      .filter(({ chainId }) => {
        if (networkFilter === ALL_NETWORKS_FILTER) return true

        return networks.find((n) => n.chainId === chainId)?.name === networkFilter
      })
      .map(({ address, chainId, tokenId }) => ({
        ...(portfolioAssetsByKey[getAssetCacheKey(address, chainId)] ||
          getPlaceholderAsset(address, chainId, standard, areCustom)),
        tokenId
      }))

    return (
      tokenOrCollectionSearch({
        networks,
        assets,
        search,
        searchType: isCollection ? 'collection' : 'token'
      }) as unknown as ManagedAsset<T>[]
    ).sort(sortByNetwork)
  }

  const hiddenPreferences = tokenPreferences.filter(
    (preference) => preference.isHidden && isOfStandard(preference)
  )
  // A hidden asset is listed as hidden only, even when it was added as custom
  const hiddenIds = new Set(hiddenPreferences.map(getAssetPreferenceId))
  const custom = customTokens.filter(
    (customToken) =>
      customToken.standard === standard && !hiddenIds.has(getAssetPreferenceId(customToken))
  )

  return {
    customAssets: toDisplayedAssets(custom, true),
    hiddenAssets: toDisplayedAssets(hiddenPreferences, false)
  }
}

type Props = {
  search: string
  networkFilter: string
  standard: CustomToken['standard']
}

type UseManageAssetsReturnType<T extends PortfolioAsset> = {
  customAssets: ManagedAsset<T>[]
  hiddenAssets: ManagedAsset<T>[]
  isLoading: boolean
}

/** The custom and the hidden assets of a standard */
const useManageAssets = <T extends PortfolioAsset>({
  search,
  networkFilter,
  standard
}: Props): UseManageAssetsReturnType<T> => {
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
    isLoading: !isAllReady && !customAssets.length && !hiddenAssets.length
  }
}

export default useManageAssets
