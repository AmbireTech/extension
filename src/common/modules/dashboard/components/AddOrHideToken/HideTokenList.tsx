import {
  TokenWithIsHiddenFlag,
  UsePortfolioReturnType
} from 'ambire-common/src/hooks/usePortfolio/types'
import React from 'react'
import { FlatList } from 'react-native'

import spacings from '@common/styles/spacings'

import TokenItem from './TokenItem'

interface Props {
  tokens: UsePortfolioReturnType['tokens']
  onRemoveHiddenToken: UsePortfolioReturnType['onRemoveHiddenToken']
  onAddHiddenToken: UsePortfolioReturnType['onAddHiddenToken']
}

const HideTokenList: React.FC<Props> = ({
  tokens = [],
  onRemoveHiddenToken,
  onAddHiddenToken
}: Props) => {
  const renderItem = ({ item }: { item: TokenWithIsHiddenFlag }) => (
    <TokenItem
      key={item.address}
      address={item.address}
      isHidden={item.isHidden}
      onPress={() => (item.isHidden ? onRemoveHiddenToken(item.address) : onAddHiddenToken(item))}
      tokenImageUrl={item.tokenImageUrl}
      symbol={item.symbol}
      network={item.network}
    />
  )

  return <FlatList data={tokens} keyExtractor={(item) => item.address} renderItem={renderItem} />
}

export default React.memo(HideTokenList)
