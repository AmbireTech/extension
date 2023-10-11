import { Token, TokenWithIsHiddenFlag } from 'ambire-common/src/hooks/usePortfolio/types'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import Input from '@common/components/Input'
import spacings from '@common/styles/spacings'

import HideCollectibleListItem from './HideCollectibleListItem'

interface Props {
  collectibles: TokenWithIsHiddenFlag[]
  toggleCollectibleHide: (token: Token, tokenId: string) => any
}

const HideCollectibleList: React.FC<Props> = ({
  collectibles = [],
  toggleCollectibleHide
}: Props) => {
  const { t } = useTranslation()
  const [searchValue, setSearchValue] = useState('')
  const [filteredCollectibles, setFilteredCollectibles] = useState(collectibles)

  useEffect(() => {
    setFilteredCollectibles(
      collectibles.filter((token) => {
        const isAddressMatch = token.address.toLowerCase() === searchValue.toLowerCase()
        const isSymbolMatch = token.symbol.toLowerCase().includes(searchValue.toLowerCase())

        return isAddressMatch || isSymbolMatch
      })
    )
  }, [searchValue, collectibles])

  const renderItem = (collectible: any, asset: any, i: number) => (
    <HideCollectibleListItem
      // Since the visible and hidden token lists are separate and they update
      // in async manner, for a split second we might have the same token in
      // both lists. This causes a warning in React, because the key is not
      // unique. To avoid this, we add the isHidden flag to the key.
      key={(asset.data && asset.data.name) + asset.isHidden + i}
      isHidden={asset.isHidden}
      assetName={asset.data && asset.data.name}
      assetImg={asset.data && asset.data.image}
      onPress={() => toggleCollectibleHide(collectible, asset.tokenId)}
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
        placeholder={t('Search by collectible symbol or address')}
        value={searchValue}
        onChangeText={setSearchValue}
        containerStyle={spacings.mbSm}
      />
      {filteredCollectibles.map((collectible, i) =>
        (collectible.assets || []).map((asset) => renderItem(collectible, asset, i))
      )}
    </>
  )
}

export default React.memo(HideCollectibleList)
