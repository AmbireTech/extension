/* eslint-disable react/prop-types */
import React, { FC, useEffect } from 'react'
import spacings from '@common/styles/spacings'
import { useModalize } from 'react-native-modalize'
import BottomSheet from '@common/components/BottomSheet'
import { getUiType } from '@web/utils/uiType'
import useTheme from '@common/hooks/useTheme'
import { RenderSelectedOptionParams } from '../types'

const { isPopup } = getUiType()

type Props = Pick<RenderSelectedOptionParams, 'isMenuOpen' | 'toggleMenu'> & {
  children: React.ReactNode
}

const BottomSheetContainer: FC<Props> = ({ isMenuOpen, toggleMenu, children }) => {
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
      id="select-bottom-sheet"
      sheetRef={sheetRef}
      closeBottomSheet={toggleMenu}
      containerInnerWrapperStyles={{
        flex: 1
      }}
      style={{
        backgroundColor: theme.primaryBackground,
        width: isPopup ? '100%' : 450,
        overflow: 'hidden',
        ...spacings.pv0,
        ...spacings.ph0
      }}
      isScrollEnabled={false}
    >
      {children}
    </BottomSheet>
  )
}

export default React.memo(BottomSheetContainer)
