/* eslint-disable react/prop-types */
import React, { FC, useEffect } from 'react'
import { useModalize } from 'react-native-modalize'

import BottomSheet from '@common/components/BottomSheet'
import { isMobile } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { getUiType } from '@common/utils/uiType'

import { RenderSelectedOptionParams } from '../types'

const { isPopup } = getUiType()

type Props = Pick<RenderSelectedOptionParams, 'isMenuOpen' | 'toggleMenu'> & {
  id?: string
  setIsMenuOpen: (isOpen: boolean) => void
  children?: React.ReactNode
  contentRef?: any
  sectionListProps?: any
}

const BottomSheetContainer: FC<Props> = ({
  id,
  isMenuOpen,
  setIsMenuOpen,
  toggleMenu,
  children,
  contentRef,
  sectionListProps
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
      closeBottomSheet={toggleMenu as () => void}
      onClosed={() => {
        // Always set isMenuOpen to false when the BottomSheet is closed
        // Fixes the issue where the state is not updated when the BottomSheet is closed
        // by dragging it down
        setIsMenuOpen(false)
      }}
      containerInnerWrapperStyles={{
        flex: 1
      }}
      style={{
        backgroundColor: theme.primaryBackground,
        width: isPopup || isMobile ? '100%' : 450,
        overflow: 'hidden',
        ...spacings.pv0,
        ...spacings.ph0
      }}
      isScrollEnabled={false}
      customRenderer={children}
    />
  )
}

export default React.memo(BottomSheetContainer)
