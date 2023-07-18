import { UsePortfolioReturnType } from 'ambire-common/src/hooks/usePortfolio/types'
import React from 'react'
import { View } from 'react-native'

import spacings from '@common/styles/spacings'

import { MODES } from './constants'
import TokenItem from './TokenItem'

interface Props {
  mode: MODES
  extraTokens: UsePortfolioReturnType['extraTokens']
  hiddenTokens: UsePortfolioReturnType['hiddenTokens']
  onRemoveExtraToken: UsePortfolioReturnType['onRemoveExtraToken']
  onRemoveHiddenToken: UsePortfolioReturnType['onRemoveHiddenToken']
}

const HideTokenList: React.FC<Props> = ({ onToggleHideToken, tokens = [] }: Props) => {
  return (
    <View style={spacings.mt}>
      {tokens.map((token) => {
        // const isHidden = !!hiddenTokens.find((t) => t.address === token.address)
        return (
          <TokenItem
            key={token.address}
            isHidden={token.isHidden}
            // TODO: Implement toggle
            onPress={() => onToggleHideToken(token)}
            {...token}
          />
        )
      })}
    </View>
  )
}

export default React.memo(HideTokenList)
