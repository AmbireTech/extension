import React from 'react'
import { ScrollView, ViewStyle } from 'react-native'
import { Modalize, ModalizeProps } from 'react-native-modalize'

export interface BottomSheetProps {
  id?: string
  sheetRef: React.RefObject<Modalize>
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
  animationDuration?: number
  children?: React.ReactNode
  // Preferences
  type?: 'modal' | 'bottom-sheet'
  adjustToContentHeight?: boolean
  modalHeight?: ModalizeProps['modalHeight']
  modalTopOffset?: ModalizeProps['modalTopOffset']
  style?: ViewStyle
  containerInnerWrapperStyles?: ViewStyle
  flatListProps?: ModalizeProps['flatListProps']
  sectionListProps?: ModalizeProps['sectionListProps']
  scrollViewProps?: ModalizeProps['scrollViewProps']
  customRenderer?: ModalizeProps['customRenderer']
  HeaderComponent?: ModalizeProps['HeaderComponent']
  FooterComponent?: ModalizeProps['FooterComponent']
  backgroundColor?: 'primaryBackground' | 'secondaryBackground'
  autoWidth?: boolean
  autoOpen?: boolean
  shouldBeClosableOnDrag?: boolean
  customZIndex?: number
  isScrollEnabled?: boolean
  reserveScrollPadding?: boolean
  withBackdropBlur?: boolean
  /**
   * Set to false to remove the drag area along the top edge of the sheet. A modal does not show it,
   * but it still catches the clicks that land on the top 20px, so content there can't be pressed.
   */
  withHandle?: boolean
}

declare const BottomSheet: React.FC<BottomSheetProps>
export default BottomSheet
