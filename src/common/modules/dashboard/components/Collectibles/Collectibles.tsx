import { UsePortfolioReturnType } from 'ambire-common/src/hooks/usePortfolio/types'
import React from 'react'
import { View } from 'react-native'

import usePrivateMode from '@common/hooks/usePrivateMode'

import CollectiblesListLoader from '../Loaders/CollectiblesListLoader'
import CollectibleItem from './CollectibleItem'
import CollectiblesEmptyState from './CollectiblesEmptyState'
import styles from './styles'

interface Props {
  collectibles: UsePortfolioReturnType['collectibles']
  isCurrNetworkBalanceLoading: boolean
}

const Collectibles = ({ collectibles, isCurrNetworkBalanceLoading }: Props) => {
  const { isPrivateMode } = usePrivateMode()

  if (isCurrNetworkBalanceLoading) {
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
    <View style={styles.itemsContainer}>
      {collectibles.map(({ network, address, collectionName, collectionImg, assets }) =>
        (assets || []).map(({ tokenId, assetName, assetImg, balanceUSD }: any) => (
          <CollectibleItem
            key={tokenId}
            tokenId={tokenId}
            network={network}
            address={address}
            assetImg={assetImg}
            collectionImg={collectionImg}
            collectionName={collectionName}
            assetName={assetName}
            balanceUSD={balanceUSD}
          />
        ))
      )}
    </View>
  )
}

export default React.memo(Collectibles)
