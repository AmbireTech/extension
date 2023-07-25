import { Token, TokenWithIsHiddenFlag } from 'ambire-common/src/hooks/usePortfolio/types'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import Input from '@common/components/Input'
import spacings from '@common/styles/spacings'

import HideTokenListItem from './HideTokenListItem'

interface Props {
  tokens: TokenWithIsHiddenFlag[]
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
    <HideTokenListItem
      // Since the visible and hidden token lists are separate and they update
      // in async manner, for a split second we might have the same token in
      // both lists. This causes a warning in React, because the key is not
      // unique. To avoid this, we add the isHidden flag to the key.
      key={token.address + token.isHidden}
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
        containerStyle={spacings.mbSm}
      />
      {filteredTokens.map(renderItem)}
    </>
  )
}

export default React.memo(HideTokenList)
