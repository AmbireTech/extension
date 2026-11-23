import type React from 'react'
import type {
  FlatListProps,
  ScrollView,
  ScrollViewProps,
  SectionListProps,
  ViewStyle
} from 'react-native'

import type { SheetRef } from './useSheetRef'

export interface BottomSheetProps {
  id?: string
  sheetRef: React.RefObject<SheetRef | null>
  scrollViewRef?: React.RefObject<ScrollView>
  /**
   * Leave undefined if you want the BottomSheet to not close by pressing the backdrop,
   * using gestures etc.
   */
  closeBottomSheet?: (dest?: 'alwaysOpen' | 'default' | undefined) => void
  onBackdropPress?: () => void
  onClosed?: () => void
  onOpened?: () => void
  onOpen?: () => void
  children?: React.ReactNode
  // Preferences
  /** Web only. On native every sheet is a bottom sheet. */
  type?: 'modal' | 'bottom-sheet'
  adjustToContentHeight?: boolean
  /** A fixed height for the sheet, instead of fitting its content */
  modalHeight?: number
  /** How far from the window's top a full height sheet stops on web */
  modalTopOffset?: number
  style?: ViewStyle
  containerInnerWrapperStyles?: ViewStyle
  flatListProps?: FlatListProps<any>
  sectionListProps?: SectionListProps<any, any>
  scrollViewProps?: ScrollViewProps
  /** Content that lays itself out and scrolls itself, in a full height sheet */
  customRenderer?: React.ReactNode
  HeaderComponent?: React.ReactNode
  FooterComponent?: React.ReactNode
  backgroundColor?: 'primaryBackground' | 'secondaryBackground' | 'primaryAccent100'
  autoOpen?: boolean
  shouldBeClosableOnDrag?: boolean
  isScrollEnabled?: boolean
  withBackdropBlur?: boolean
  /**
   * Set to false to remove the drag area along the top edge of the sheet. A modal does not show it,
   * but it still catches the clicks that land on the top 20px, so content there can't be pressed.
   */
  withHandle?: boolean
}
