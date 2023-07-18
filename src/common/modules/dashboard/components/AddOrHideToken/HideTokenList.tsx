import {
  Token,
  TokenWithIsHiddenFlag,
  UsePortfolioReturnType
} from 'ambire-common/src/hooks/usePortfolio/types'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import Input from '@common/components/Input'

import TokenItem from './TokenItem'

interface Props {
  tokens: UsePortfolioReturnType['tokens']
  toggleTokenHide: (token: Token) => any
}

const HideTokenList: React.FC<Props> = ({ tokens = [], toggleTokenHide }: Props) => {
  const { t } = useTranslation()
  const [searchValue, setSearchValue] = useState('')
  const [filteredTokens, setFilteredTokens] = useState(tokens)

  useEffect(() => {
    setFilteredTokens(
      tokens.filter((token) => {
        const isAddressMatch = token.address.toLowerCase() === searchValue.toLowerCase()
        const isSymbolMatch = token.symbol.toLowerCase().includes(searchValue.toLowerCase())

        return isAddressMatch || isSymbolMatch
      })
    )
  }, [searchValue, tokens])

  const renderItem = (token: TokenWithIsHiddenFlag) => (
    <TokenItem
      key={token.address}
      address={token.address}
      isHidden={token.isHidden}
      onPress={() => toggleTokenHide(token)}
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
  return (
    <>
      <Input
        placeholder={t('Search by token symbol or address')}
        value={searchValue}
        onChangeText={setSearchValue}
      />
      {filteredTokens.map(renderItem)}
    </>
  )
}

export default React.memo(HideTokenList)
