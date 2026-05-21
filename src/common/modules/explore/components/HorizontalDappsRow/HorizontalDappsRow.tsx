import React, { useCallback, useMemo } from 'react'
import { FlatList, ListRenderItemInfo } from 'react-native'

import { Dapp } from '@ambire-common/interfaces/dapp'
import useWindowSize from '@common/hooks/useWindowSize'
import { SPACING_SM } from '@common/styles/spacings'
import spacings from '@common/styles/spacings'

import HorizontalDappItem, {
  HORIZONTAL_ITEM_GUTTER,
  HORIZONTAL_ITEM_WIDTH
} from '../HorizontalDappItem'

type Props = {
  data: Dapp[]
}

const MIN_PEAK = 12
// HORIZONTAL_ITEM_GUTTER is the minimum allowed gutter between items
const MIN_ITEMS = 4

const HorizontalDappsRow = ({ data }: Props) => {
  const { width } = useWindowSize()
  // The FlatList sits inside a container with SPACING_SM padding on each side
  const scrollableWidth = width - 2 * SPACING_SM

  // How many full items fit at minimum gutter, leaving MIN_PEAK*2 for the next-item peek.
  // N scales up automatically as screens get wider (4 → 5 → 6 …).
  const itemsCount = useMemo(
    () =>
      Math.max(
        MIN_ITEMS,
        Math.floor(
          (scrollableWidth - 2 * MIN_PEAK) / (HORIZONTAL_ITEM_WIDTH + HORIZONTAL_ITEM_GUTTER)
        )
      ),
    [scrollableWidth]
  )

  // snapInterval is derived from the middle-scroll constraint: N full items must fit between
  // a MIN_PEAK left peek and a MIN_PEAK right peek, with one gutter on each flanking side.
  // Formula: (N+1) * snapInterval = scrollableWidth + ITEM_WIDTH - 2*MIN_PEAK
  // This guarantees item i-1 peeks MIN_PEAK on the left AND item i+N peeks MIN_PEAK on the right
  // at every middle snap position.
  const snapInterval = useMemo(
    () => (scrollableWidth + HORIZONTAL_ITEM_WIDTH - 2 * MIN_PEAK) / (itemsCount + 1),
    [scrollableWidth, itemsCount]
  )

  const gutter = useMemo(() => snapInterval - HORIZONTAL_ITEM_WIDTH, [snapInterval])

  // Snap positions:
  // - snap[0] = 0              → item 0 flush left
  // - snap[i] = i*S - G - P   → item i-1 peeks MIN_PEAK on left, item i+N peeks MIN_PEAK on right
  // - snap[last] = maxScroll   → last item flush right
  const snapToOffsets = useMemo(() => {
    if (!scrollableWidth || data.length <= 1) return undefined

    const n = data.length
    // scrollX where last item's right visual edge aligns with the scrollable area's right edge
    const maxScroll = Math.max(0, n * snapInterval - gutter - scrollableWidth)
    let lastOffset = 0
    const offsets: number[] = [lastOffset]

    for (let i = 1; i < n; i++) {
      const snap = Math.min(i * snapInterval - gutter - MIN_PEAK, maxScroll)
      if (snap > lastOffset) {
        offsets.push(snap)
        lastOffset = snap
      }
      if (snap >= maxScroll) break
    }

    if (lastOffset < maxScroll) offsets.push(maxScroll)

    return offsets
  }, [data.length, gutter, snapInterval, scrollableWidth])

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<Dapp>) => (
      <HorizontalDappItem dapp={item} gutter={index === data.length - 1 ? 0 : gutter} />
    ),
    [data.length, gutter]
  )

  const keyExtractor = useCallback((item: Dapp) => item.id, [])

  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      snapToOffsets={snapToOffsets}
      decelerationRate="fast"
      style={spacings.mbSm}
    />
  )
}

export default React.memo(HorizontalDappsRow)
