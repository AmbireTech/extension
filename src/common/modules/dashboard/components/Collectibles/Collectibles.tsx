import { UsePortfolioReturnType } from 'ambire-common/src/hooks/usePortfolio/types'
import React from 'react'
import { View } from 'react-native'

import useNetwork from '@common/hooks/useNetwork'
import usePrivateMode from '@common/hooks/usePrivateMode'

import HideCollectible from '../HideCollectible'
import CollectiblesListLoader from '../Loaders/CollectiblesListLoader'
import CollectibleItem from './CollectibleItem'
import CollectiblesEmptyState from './CollectiblesEmptyState'
import styles from './styles'

interface Props {
  collectibles: UsePortfolioReturnType['collectibles']
  hiddenCollectibles: UsePortfolioReturnType['hiddenCollectibles']
  onAddHiddenCollectible: UsePortfolioReturnType['onAddHiddenCollectible']
  onRemoveHiddenCollectible: UsePortfolioReturnType['onRemoveHiddenCollectible']
  isCurrNetworkBalanceLoading: boolean
}

const Collectibles = ({
  collectibles,
  hiddenCollectibles,
  onAddHiddenCollectible,
  onRemoveHiddenCollectible,
  isCurrNetworkBalanceLoading
}: Props) => {
  const { isPrivateMode } = usePrivateMode()
  const { network } = useNetwork()

  if (isCurrNetworkBalanceLoading && !collectibles?.length) {
    return <CollectiblesListLoader />
  }

  if (!collectibles?.length || isPrivateMode) {
    return (
      <CollectiblesEmptyState
        isPrivateMode={isPrivateMode}
        collectiblesLength={collectibles.length || 0}
      />
    )
  }

  return (
    <>
      <View style={styles.itemsContainer}>
        {collectibles.map(({ address, collectionName, assets, balanceUSD }) =>
          (assets || []).map(({ tokenId, assetName, data }: any) => (
            <CollectibleItem
              key={tokenId}
              tokenId={tokenId}
              address={address}
              network={network && network.id}
              assetImg={data && data.image}
              collectionImg={data && data.image}
              collectionName={collectionName}
              assetName={assetName}
              balanceUSD={balanceUSD}
            />
          ))
        )}
      </View>
      <HideCollectible
        collectibles={collectibles}
        hiddenCollectibles={hiddenCollectibles}
        onAddHiddenCollectible={onAddHiddenCollectible}
        onRemoveHiddenCollectible={onRemoveHiddenCollectible}
      />
    </>
  )
}

export default React.memo(Collectibles)
