/* eslint-disable react/prop-types */
import React, { FC, useEffect } from 'react'
import { FlatListProps, ScrollView, SectionListProps } from 'react-native'
import { useModalize } from 'react-native-modalize'

import BottomSheet from '@common/components/BottomSheet'
import { isMobile } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import { getUiType } from '@common/utils/uiType'

import { RenderSelectedOptionParams } from '../types'

const { isPopup } = getUiType()

type Props = Pick<RenderSelectedOptionParams, 'isMenuOpen' | 'toggleMenu'> & {
  id?: string
  setIsMenuOpen: (isOpen: boolean) => void
  children?: React.ReactNode
  contentRef?: React.RefObject<ScrollView>
  sectionListProps?: SectionListProps<any, any> & { ref?: React.Ref<any> }
  flatListProps?: FlatListProps<any> & { ref?: React.Ref<any> }
  HeaderComponent?: React.ReactNode
}

const BottomSheetContainer: FC<Props> = ({
  id,
  isMenuOpen,
  setIsMenuOpen,
  toggleMenu,
  children,
  contentRef,
  sectionListProps,
  flatListProps,
  HeaderComponent
}) => {
  const { theme } = useTheme()
  const { ref: sheetRef, open: openSheet, close: closeSheet } = useModalize()

  useEffect(() => {
    if (isMenuOpen) {
      openSheet()
    } else {
      closeSheet()
    }
  }, [isMenuOpen, openSheet, closeSheet])

  return (
    <BottomSheet
      id={id}
      sheetRef={sheetRef}
      scrollViewRef={contentRef}
      sectionListProps={sectionListProps}
      flatListProps={flatListProps}
      HeaderComponent={HeaderComponent}
      closeBottomSheet={toggleMenu as () => void}
      onClosed={() => {
        // Always set isMenuOpen to false when the BottomSheet is closed
        // Fixes the issue where the state is not updated when the BottomSheet is closed
        // by dragging it down
        setIsMenuOpen(false)
      }}
      containerInnerWrapperStyles={{ flex: 1 }}
      style={{
        backgroundColor: theme.primaryBackground,
        width: isPopup || isMobile ? '100%' : 450
      }}
      isScrollEnabled={false}
      customRenderer={children}
    />
  )
}

export default React.memo(BottomSheetContainer)
