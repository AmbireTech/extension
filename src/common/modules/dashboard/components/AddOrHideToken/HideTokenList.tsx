import {
  TokenWithIsHiddenFlag,
  UsePortfolioReturnType
} from 'ambire-common/src/hooks/usePortfolio/types'
import React from 'react'

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
  const renderItem = (token: TokenWithIsHiddenFlag) => (
    <TokenItem
      key={token.address}
      address={token.address}
      isHidden={token.isHidden}
      onPress={() =>
        token.isHidden ? onRemoveHiddenToken(token.address) : onAddHiddenToken(token)
      }
      tokenImageUrl={token.tokenImageUrl}
      symbol={token.symbol}
      network={token.network}
    />
  )

  return tokens.map(renderItem)
}

export default React.memo(HideTokenList)
