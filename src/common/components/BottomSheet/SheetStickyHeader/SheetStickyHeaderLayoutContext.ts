import { createContext } from 'react'
import { Animated } from 'react-native'

/** Where a sheet's sticky section headers pin and how far their glass reaches. */
export type SheetStickyHeaderLayout = {
  /** The height of a sheet header over the list: the headers pin right below it */
  offset: number
  /** How far the list's padding keeps its headers from the sheet's sides */
  sidePadding: number
  /** Receives the list's scroll value, which the headers follow */
  scrollValueRef?: { current: Animated.Value | null }
}

export const SheetStickyHeaderLayoutContext = createContext<SheetStickyHeaderLayout>({
  offset: 0,
  sidePadding: 0
})
