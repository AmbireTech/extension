import React, { FC, useCallback, useState } from 'react'
import { LayoutChangeEvent, StyleProp, View, ViewStyle } from 'react-native'

import { useBottomSheet } from '@common/components/BottomSheet/BottomSheetContext'
import { bottomSheetCloseEventStream } from '@common/components/BottomSheet/bottomSheetEventStream'
import SheetHeaderButton, {
  SHEET_HEADER_BUTTON_SIZE
} from '@common/components/BottomSheet/SheetHeaderButton'
import { isWeb } from '@common/config/env'
import spacings, { SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  /** The sheet's title, centered between the buttons. */
  children?: React.ReactNode
  /** Steps back inside the sheet. Without it a nested sheet's ‹ returns to its parent. */
  onBack?: () => void
  /** Actions shown left of the X. */
  rightContent?: React.ReactNode
  style?: StyleProp<ViewStyle>
}

const closeAllSheets = () => bottomSheetCloseEventStream.next()

const SIDE_SLOT_STYLE = { minWidth: SHEET_HEADER_BUTTON_SIZE, flexShrink: 0 }

/**
 * The header row of a native bottom sheet: ‹ back on the left when there is somewhere to
 * go back to, the X on the right and the title centered between them. The X of a nested
 * sheet closes every sheet. On web, and outside a sheet, only the title is rendered.
 */
const SheetHeaderRow: FC<Props> = ({ children, onBack, rightContent, style }) => {
  const { isInsideBottomSheet, isNested, close } = useBottomSheet()
  // The left side is as wide as the right one, so the title stays centered
  const [rightSideWidth, setRightSideWidth] = useState(SHEET_HEADER_BUTTON_SIZE)
  const handleRightSideLayout = useCallback(
    (e: LayoutChangeEvent) => setRightSideWidth(e.nativeEvent.layout.width),
    []
  )

  if (isWeb || !isInsideBottomSheet) return <>{children}</>

  const handleBack = onBack || (isNested ? close : undefined)
  // A sheet the user can't close gets no X, nested or not
  const handleClose = close && (isNested ? closeAllSheets : close)
  const hasSides = !!handleBack || !!handleClose || !!rightContent

  return (
    <View
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        spacings.mb,
        { minHeight: SHEET_HEADER_BUTTON_SIZE, columnGap: SPACING_TY },
        style
      ]}
    >
      {hasSides && (
        <View style={[SIDE_SLOT_STYLE, { minWidth: rightSideWidth }]}>
          {!!handleBack && <SheetHeaderButton type="back" onPress={handleBack} />}
        </View>
      )}
      <View style={[flexbox.flex1, flexbox.alignCenter]}>{children}</View>
      {hasSides && (
        <View
          style={[
            SIDE_SLOT_STYLE,
            flexbox.directionRow,
            flexbox.alignCenter,
            { columnGap: SPACING_TY }
          ]}
          onLayout={handleRightSideLayout}
        >
          {rightContent}
          {!!handleClose && <SheetHeaderButton type="close" onPress={handleClose} />}
        </View>
      )}
    </View>
  )
}

export default React.memo(SheetHeaderRow)
