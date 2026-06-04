import React, { useCallback, useMemo, useState } from 'react'
import { LayoutChangeEvent, View } from 'react-native'

import { Dapp } from '@ambire-common/interfaces/dapp'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import HorizontalDappItem, {
  HORIZONTAL_ITEM_GUTTER,
  HORIZONTAL_ITEM_WIDTH
} from '../HorizontalDappItem'

type Props = {
  data: Dapp[]
}

const MIN_ITEMS = 4

// On web/extension we don't horizontally scroll the section. We show the maximum number of items
// that fit on a single row and align them left-to-right with a fixed gutter. The gutter and the
// max-fit count are derived solely from the row width (identical for every section), so items in
// the same column position stay visually aligned across all sections regardless of how many items
// each section has. The remaining items are reachable by pressing the section header, which opens
// the full section in a dedicated screen.
const HorizontalDappsRow = ({ data }: Props) => {
  const [rowWidth, setRowWidth] = useState(0)

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setRowWidth(event.nativeEvent.layout.width)
  }, [])

  // Largest N with N items and (N-1) gutters of at least HORIZONTAL_ITEM_GUTTER fitting in rowWidth:
  //   N*ITEM_WIDTH + (N-1)*MIN_GUTTER <= rowWidth
  //   N <= (rowWidth + MIN_GUTTER) / (ITEM_WIDTH + MIN_GUTTER)
  const maxFit = useMemo(() => {
    if (!rowWidth) return MIN_ITEMS
    return Math.max(
      MIN_ITEMS,
      Math.floor(
        (rowWidth + HORIZONTAL_ITEM_GUTTER) / (HORIZONTAL_ITEM_WIDTH + HORIZONTAL_ITEM_GUTTER)
      )
    )
  }, [rowWidth])

  // Fixed gutter that fills rowWidth with exactly maxFit items. Same rowWidth + maxFit for every
  // section ⇒ same gutter ⇒ columns line up across sections. >= HORIZONTAL_ITEM_GUTTER by maxFit's
  // construction.
  const gutter = useMemo(
    () => (maxFit > 1 ? (rowWidth - maxFit * HORIZONTAL_ITEM_WIDTH) / (maxFit - 1) : 0),
    [rowWidth, maxFit]
  )

  const visibleItems = useMemo(() => data.slice(0, Math.min(maxFit, data.length)), [data, maxFit])

  return (
    <View style={[flexbox.directionRow, spacings.mb]} onLayout={handleLayout}>
      {visibleItems.map((dapp, index) => {
        const isLast = index === visibleItems.length - 1
        return (
          <HorizontalDappItem
            key={dapp.id}
            dapp={dapp}
            gutter={isLast ? 0 : gutter}
            isFirst={index === 0}
            isLast={isLast}
          />
        )
      })}
    </View>
  )
}

export default React.memo(HorizontalDappsRow)
