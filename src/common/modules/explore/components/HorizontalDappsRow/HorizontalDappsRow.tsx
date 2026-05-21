import React, { useCallback, useMemo } from 'react'
import { FlatList, ListRenderItemInfo } from 'react-native'

import { Dapp } from '@ambire-common/interfaces/dapp'
import { isWeb } from '@common/config/env'
import useWindowSize from '@common/hooks/useWindowSize'
import spacings, { SPACING_SM } from '@common/styles/spacings'

import HorizontalDappItem, {
  HORIZONTAL_ITEM_GUTTER,
  HORIZONTAL_ITEM_WIDTH
} from '../HorizontalDappItem'

type Props = {
  data: Dapp[]
}

const MIN_PEAK = 12
const MIN_ITEMS = 4

const HorizontalDappsRow = ({ data }: Props) => {
  const { width } = useWindowSize()
  // The FlatList sits inside a container with SPACING_SM padding on each side
  const scrollableWidth = width - 2 * SPACING_SM

  // N = full items visible at scroll=0 (with item N peeking 2*MIN_PEAK on the right).
  // Bound by the minimum-gutter constraint: gutter = (scrollableWidth - 2*MIN_PEAK)/N - ITEM_WIDTH >= MIN_GUTTER
  // i.e. N <= (scrollableWidth - 2*MIN_PEAK) / (ITEM_WIDTH + MIN_GUTTER)
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

  // Gutter is derived from the scroll=0 constraint:
  //   N*ITEM_WIDTH + N*gutter + 2*MIN_PEAK = scrollableWidth
  // i.e. at scroll=0 we have item 0 flush left, N full items separated by `gutter`, then
  // a final `gutter` and item N peeking exactly 2*MIN_PEAK.
  const gutter = useMemo(
    () => (scrollableWidth - 2 * MIN_PEAK - itemsCount * HORIZONTAL_ITEM_WIDTH) / itemsCount,
    [scrollableWidth, itemsCount]
  )

  const snapInterval = useMemo(() => HORIZONTAL_ITEM_WIDTH + gutter, [gutter])

  // Snap positions:
  // - snap[0] = 0              → item 0 flush left, item N peeks 2*MIN_PEAK on the right
  // - snap[i] (middle)         → symmetric peeks on both sides; item (i-1) and item (i+M-1) each
  //                              peek `middlePeek` pixels, where M is the count of full items
  //                              shown between the two peeks at middle snaps.
  //   Derivation: viewport width = leftPeek + M*ITEM_WIDTH + (M+1)*gutter + rightPeek
  //   For symmetric peeks: peek = (scrollableWidth - M*ITEM_WIDTH - (M+1)*gutter) / 2
  //   M is the largest count such that peek >= MIN_PEAK.
  // - snap[last] = maxScroll   → last item flush right, item (n-N) peeks 2*MIN_PEAK on the left
  const middleFullItems = useMemo(() => {
    // Largest M with (scrollableWidth - M*ITEM_WIDTH - (M+1)*gutter)/2 >= MIN_PEAK
    // i.e. M*(ITEM_WIDTH + gutter) <= scrollableWidth - gutter - 2*MIN_PEAK
    return Math.max(1, Math.floor((scrollableWidth - gutter - 2 * MIN_PEAK) / snapInterval))
  }, [scrollableWidth, gutter, snapInterval])

  const middlePeek = useMemo(
    () =>
      (scrollableWidth - middleFullItems * HORIZONTAL_ITEM_WIDTH - (middleFullItems + 1) * gutter) /
      2,
    [scrollableWidth, middleFullItems, gutter]
  )

  const snapToOffsets = useMemo(() => {
    if (!scrollableWidth || data.length <= 1) return undefined

    const n = data.length
    const contentWidth = n * HORIZONTAL_ITEM_WIDTH + (n - 1) * gutter
    const maxScroll = Math.max(0, contentWidth - scrollableWidth)
    let lastOffset = 0
    const offsets: number[] = [lastOffset]

    // Middle snap S_i places item (i-1) peeking `middlePeek` on the left:
    //   (i-1)*snapInterval + ITEM_WIDTH - S_i = middlePeek
    //   S_i = (i-1)*snapInterval + ITEM_WIDTH - middlePeek
    for (let i = 1; i < n; i++) {
      const snap = Math.min((i - 1) * snapInterval + HORIZONTAL_ITEM_WIDTH - middlePeek, maxScroll)
      if (snap > lastOffset) {
        offsets.push(snap)
        lastOffset = snap
      }
      if (snap >= maxScroll) break
    }

    if (lastOffset < maxScroll) offsets.push(maxScroll)

    return offsets
  }, [data.length, gutter, snapInterval, middlePeek, scrollableWidth])

  // react-native-web ignores snapToOffsets/snapToInterval/decelerationRate. The only built-in web
  // snap support is `pagingEnabled` which emits scroll-snap CSS. Apply CSS scroll-snap manually
  // so web matches native middle-snap visuals as closely as possible (item k aligned-start with
  // a scroll-padding-left that places it at viewport_x = ITEM_WIDTH - middlePeek + gutter, the
  // same as native snap[k] for k >= 1; scroll positions 0 and maxScroll clamp naturally).
  const webSnapStyle = useMemo(
    () =>
      isWeb
        ? ({
            scrollSnapType: 'x mandatory',
            scrollPaddingLeft: gutter + middlePeek
          } as any)
        : undefined,
    [gutter, middlePeek]
  )

  const webItemSnapStyle = useMemo(
    () => (isWeb ? ({ scrollSnapAlign: 'start', scrollSnapStop: 'always' } as any) : undefined),
    []
  )

  // First item: shift its snap-area origin so the snap position lands at scroll=0 (item 0 flush
  // left) instead of at -(gutter+middlePeek), which would be clamped by the browser without
  // becoming a true snap target.
  const webFirstItemSnapStyle = useMemo(
    () =>
      isWeb
        ? ({
            scrollSnapAlign: 'start',
            scrollSnapStop: 'always',
            scrollMarginLeft: -(gutter + middlePeek)
          } as any)
        : undefined,
    [gutter, middlePeek]
  )

  // Last item snaps right-aligned so maxScroll is reachable as a snap target. Without this the
  // last `start`-aligned snap is far past the actual maxScroll and the browser only snaps to
  // an earlier position.
  const webLastItemSnapStyle = useMemo(
    () => (isWeb ? ({ scrollSnapAlign: 'end', scrollSnapStop: 'always' } as any) : undefined),
    []
  )

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<Dapp>) => {
      const isFirst = index === 0
      const isLast = index === data.length - 1
      let snapStyle = webItemSnapStyle
      if (isFirst) snapStyle = webFirstItemSnapStyle
      else if (isLast) snapStyle = webLastItemSnapStyle
      return (
        <HorizontalDappItem dapp={item} gutter={isLast ? 0 : gutter} webSnapStyle={snapStyle} />
      )
    },
    [data.length, gutter, webItemSnapStyle, webFirstItemSnapStyle, webLastItemSnapStyle]
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
      style={[spacings.mb, webSnapStyle]}
    />
  )
}

export default React.memo(HorizontalDappsRow)
