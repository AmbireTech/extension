import React, { useCallback } from 'react'
import { FlatList, ListRenderItemInfo } from 'react-native'

import { Dapp } from '@ambire-common/interfaces/dapp'
import spacings from '@common/styles/spacings'

import HorizontalDappItem, {
  HORIZONTAL_ITEM_GUTTER,
  HORIZONTAL_ITEM_WIDTH
} from '../HorizontalDappItem'

type Props = {
  data: Dapp[]
}

const SNAP_INTERVAL = HORIZONTAL_ITEM_WIDTH + HORIZONTAL_ITEM_GUTTER

const HorizontalDappsRow = ({ data }: Props) => {
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Dapp>) => <HorizontalDappItem dapp={item} />,
    []
  )

  const keyExtractor = useCallback((item: Dapp) => item.id, [])

  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      // App Store-style snap: each tap of the carousel advances by exactly one item
      // (item width + gutter). `decelerationRate="fast"` makes the snap feel tactile.
      snapToInterval={SNAP_INTERVAL}
      snapToAlignment="start"
      decelerationRate="fast"
      style={spacings.mbSm}
    />
  )
}

export default React.memo(HorizontalDappsRow)
