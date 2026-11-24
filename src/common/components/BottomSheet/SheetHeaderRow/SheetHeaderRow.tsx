import { Portal } from '@gorhom/portal'
import React, { FC, useLayoutEffect, useMemo, useState } from 'react'
import { StyleProp, View, ViewStyle } from 'react-native'

import { useBottomSheet } from '@common/components/BottomSheet/BottomSheetContext'
import { bottomSheetCloseEventStream } from '@common/components/BottomSheet/bottomSheetEventStream'
import HeaderButton, { HEADER_BUTTON_SIZE } from '@common/components/HeaderButton'
import spacings, { SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import { SheetHeaderTitleContext, SheetHeaderTitleContextValue } from './SheetHeaderTitleContext'

type Props = {
  /** The sheet's title, centered between the buttons, or on the left when too long for that. */
  children?: React.ReactNode
  /** Steps back inside the sheet. Without it a nested sheet's ‹ returns to its parent. */
  onBack?: () => void
  /** Actions shown left of the X. */
  rightContent?: React.ReactNode
  /** Keeps a long title centered, cut at its `numberOfLines`, instead of moving it left to wrap. */
  isTitleAlwaysCentered?: boolean
  style?: StyleProp<ViewStyle>
}

const closeAllSheets = () => bottomSheetCloseEventStream.next()

const SIDE_SLOT_STYLE = { minWidth: HEADER_BUTTON_SIZE, flexShrink: 0 }

/**
 * The header row of a bottom sheet: ‹ back on the left when there is somewhere to
 * go back to, the X on the right and the title centered between them. The X of a nested
 * sheet closes every sheet. It renders in the sheet's fixed header, above the scrolling
 * content. Outside a sheet only the title is rendered, in place.
 */
const SheetHeaderRow: FC<Props> = ({
  children,
  onBack,
  rightContent,
  isTitleAlwaysCentered = false,
  style
}) => {
  const {
    isInsideBottomSheet,
    isNested,
    close,
    headerHostName,
    isHeaderFloating,
    setIsHeaderRowTitleless
  } = useBottomSheet()
  const hasTitle = !!children
  const handleBack = onBack || (isNested ? close : undefined)
  // A title that wraps while centered moves left over the space the centering kept free,
  // where it may take a second line (only without a back button, as the X alone is on the right)
  const [isTitleLeft, setIsTitleLeft] = useState(false)
  const canTitleMoveLeft = !handleBack && hasTitle && !isTitleAlwaysCentered
  const isTitleOnLeft = canTitleMoveLeft && isTitleLeft
  // The first line of a title that wraps, which the buttons line up with instead of its middle
  const [wrappedTitleFirstLineHeight, setWrappedTitleFirstLineHeight] = useState<number | null>(
    null
  )
  const titleContextValue = useMemo<SheetHeaderTitleContextValue>(
    () => ({
      align: isTitleOnLeft ? 'left' : 'center',
      isLineCapIgnored: canTitleMoveLeft && !isTitleOnLeft,
      reportLines: (lineCount, firstLineHeight) => {
        if (lineCount > 1 && canTitleMoveLeft) setIsTitleLeft(true)
        setWrappedTitleFirstLineHeight(lineCount > 1 ? firstLineHeight : null)
      }
    }),
    [isTitleOnLeft, canTitleMoveLeft]
  )
  // Before paint, so the sheet never shows a header bar behind the buttons of a title-less row
  useLayoutEffect(() => {
    if (!setIsHeaderRowTitleless || !headerHostName) return undefined
    setIsHeaderRowTitleless(!hasTitle)
    return () => setIsHeaderRowTitleless(false)
  }, [hasTitle, headerHostName, setIsHeaderRowTitleless])

  if (!isInsideBottomSheet) return <>{children}</>

  // A sheet the user can't close gets no X, nested or not
  const handleClose = close && (isNested ? closeAllSheets : close)
  const hasSides = !!handleBack || !!handleClose || !!rightContent
  const isTitleWrapped = wrappedTitleFirstLineHeight !== null

  // Only the buttons take touches, as a title-less row floats over the content
  const row = (
    <View
      pointerEvents="box-none"
      style={[
        flexbox.directionRow,
        isTitleWrapped ? flexbox.alignStart : flexbox.alignCenter,
        spacings.mb,
        { minHeight: HEADER_BUTTON_SIZE, columnGap: SPACING_TY },
        style,
        // A floating header spaces the row from its edge itself, the same in every sheet
        isHeaderFloating && spacings.mb0
      ]}
    >
      {/* As wide as the X, which centers the title. Not as wide as the X with `rightContent`, */}
      {/* as mirroring a wide action would leave the title no room on a narrow sheet */}
      {hasSides && !isTitleOnLeft && (
        <View pointerEvents="box-none" style={SIDE_SLOT_STYLE}>
          {!!handleBack && (
            <HeaderButton type="back" onPress={handleBack} testID="bottom-sheet-back-button" />
          )}
        </View>
      )}
      <View
        pointerEvents="box-none"
        style={[
          flexbox.flex1,
          isTitleOnLeft ? flexbox.alignStart : flexbox.alignCenter,
          // Centers the first line on the buttons, which sit at the top of the row
          isTitleWrapped && {
            paddingTop: Math.max(0, (HEADER_BUTTON_SIZE - wrappedTitleFirstLineHeight) / 2)
          }
        ]}
      >
        <SheetHeaderTitleContext.Provider value={titleContextValue}>
          {children}
        </SheetHeaderTitleContext.Provider>
      </View>
      {hasSides && (
        <View
          pointerEvents="box-none"
          style={[
            SIDE_SLOT_STYLE,
            flexbox.directionRow,
            flexbox.alignCenter,
            { columnGap: SPACING_TY }
          ]}
        >
          {rightContent}
          {!!handleClose && (
            <HeaderButton type="close" onPress={handleClose} testID="bottom-sheet-close-button" />
          )}
        </View>
      )}
    </View>
  )

  // Rendered in the sheet's fixed header, so it doesn't scroll away with the content
  if (!headerHostName) return row

  return <Portal hostName={headerHostName}>{row}</Portal>
}

export default React.memo(SheetHeaderRow)
