import React from 'react'
import { ScrollView, ViewStyle } from 'react-native'
import { Modalize, ModalizeProps } from 'react-native-modalize'

export interface BottomSheetProps {
  id?: string
  sheetRef: React.RefObject<Modalize>
  scrollViewRef?: React.RefObject<ScrollView>
  closeBottomSheet?: (dest?: 'alwaysOpen' | 'default' | undefined) => void
  onBackdropPress?: () => void
  onClosed?: () => void
  onOpen?: () => void
  children?: React.ReactNode
  // Preferences
  type?: 'modal' | 'bottom-sheet'
  adjustToContentHeight?: boolean
  style?: ViewStyle
  containerInnerWrapperStyles?: ViewStyle
  flatListProps?: ModalizeProps['flatListProps']
  sectionListProps?: ModalizeProps['sectionListProps']
  scrollViewProps?: ModalizeProps['scrollViewProps']
  customRenderer?: ModalizeProps['customRenderer']
  backgroundColor?: 'primaryBackground' | 'secondaryBackground'
  autoWidth?: boolean
  autoOpen?: boolean
  shouldBeClosableOnDrag?: boolean
  customZIndex?: number
  isScrollEnabled?: boolean
  withBackdropBlur?: boolean
}

declare const BottomSheet: React.FC<BottomSheetProps>
export default BottomSheet
