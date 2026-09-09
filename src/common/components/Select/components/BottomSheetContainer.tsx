import React, { FC, useCallback, useEffect, useMemo } from 'react'
import { FlatListProps, ScrollView, SectionListProps } from 'react-native'
import { useModalize } from 'react-native-modalize'

import BottomSheet from '@common/components/BottomSheet'
import { isMobile } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import { getUiType } from '@common/utils/uiType'

import { RenderSelectedOptionParams } from '../types'

const { isPopup, isSidePanel } = getUiType()

// Hoisted stable references so that re-renders of this component don't
// create new inline object/function props every time, which would defeat
// the `React.memo` wrapper on `BottomSheet` and cause the nested-Portal
// infinite-update loop inside `react-native-modalize` / `@gorhom/portal`.
const CONTAINER_INNER_WRAPPER_STYLES = { flex: 1 } as const
const BOTTOM_SHEET_WIDTH = isPopup || isSidePanel || isMobile ? ('100%' as const) : 450

type Props = Pick<RenderSelectedOptionParams, 'isMenuOpen'> & {
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

  // Closes, never toggles: keeps the menu state in sync when the sheet is dragged
  // down, and stops a backdrop press mid-close from flipping it back open.
  const closeMenu = useCallback(() => {
    setIsMenuOpen(false)
  }, [setIsMenuOpen])

  const bottomSheetStyle = useMemo(
    () => ({
      backgroundColor: theme.primaryBackground,
      width: BOTTOM_SHEET_WIDTH
    }),
    [theme.primaryBackground]
  )

  return (
    <BottomSheet
      id={id}
      sheetRef={sheetRef}
      scrollViewRef={contentRef}
      sectionListProps={sectionListProps}
      flatListProps={flatListProps}
      HeaderComponent={HeaderComponent}
      closeBottomSheet={closeMenu}
      onClosed={closeMenu}
      containerInnerWrapperStyles={CONTAINER_INNER_WRAPPER_STYLES}
      style={bottomSheetStyle}
      isScrollEnabled={false}
      customRenderer={children}
    />
  )
}

export default React.memo(BottomSheetContainer)
