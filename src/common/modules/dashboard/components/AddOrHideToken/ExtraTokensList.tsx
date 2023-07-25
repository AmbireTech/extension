import { Token, TokenWithIsHiddenFlag } from 'ambire-common/src/hooks/usePortfolio/types'
import React from 'react'

import ExtraTokensListItem from './ExtraTokensListItem'

interface Props {
  tokens: TokenWithIsHiddenFlag[]
  onRemoveExtraToken: (tokenAddress: Token['address']) => any
}

const ExtraTokensList: React.FC<Props> = ({ tokens = [], onRemoveExtraToken }: Props) => {
  const renderItem = (token: TokenWithIsHiddenFlag) => (
    <ExtraTokensListItem
      // Since the visible and hidden token lists are separate and they update
      // in async manner, for a split second we might have the same token in
      // both lists. This causes a warning in React, because the key is not
      // unique. To avoid this, we add the isHidden flag to the key.
      key={token.address + token.isHidden}
      address={token.address}
      onPress={() => onRemoveExtraToken(token.address)}
      tokenImageUrl={token.tokenImageUrl}
      symbol={token.symbol}
      network={token.network}
    />
  )

  // Not in a FlatList, because it causes the following error when this
  // component is used inside a bottom sheet component:
  // VirtualizedLists should never be nested inside plain ScrollViews with the
  // same orientation because it can break windowing and other functionality
  // - use another VirtualizedList-backed container instead.
  return <>{tokens.map(renderItem)}</>
}

export default React.memo(ExtraTokensList)
