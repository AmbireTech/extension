import React, { FC, useCallback } from 'react'
import { Modalize } from 'react-native-modalize'

import { Account } from '@ambire-common/interfaces/account'
import AccountKeys from '@common/components/AccountKeysBottomSheet/AccountKeys'
import type { RemovableKeys } from '@common/components/AccountKeysBottomSheet/AccountKeys/AccountKeys'
import BottomSheet from '@common/components/BottomSheet'
import { isMobile, isWeb } from '@common/config/env'
import useCompactLayout from '@common/hooks/useCompactLayout'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { getUiType } from '@common/utils/uiType'

interface Props {
  sheetRef: React.RefObject<Modalize>
  closeBottomSheet: () => void
  account: Account | null
  openAddAccountBottomSheet?: () => void
  showExportImport?: boolean
  /** Which imported keys the user can remove, see `AccountKeys` */
  removableKeys?: RemovableKeys
  chainId?: bigint
}

const { isPopup } = getUiType()

// The width cap fits only a centered modal. In the popup this sheet is a bottom sheet, which the
// cap would leave narrower than the popup and pinned to its left edge
const WIDE_LAYOUT_SHEET_STYLE = { maxWidth: 432, minHeight: 432, ...spacings.pvLg }

// A compact view shows a full-width bottom sheet, so only a wider layout gets the minimum height.
// The popup has no minimum either, so that a single key doesn't leave the sheet mostly empty
const getSheetStyle = (isCompactLayout: boolean) => {
  if (isCompactLayout) return undefined
  if (isPopup) return spacings.pvLg
  return WIDE_LAYOUT_SHEET_STYLE
}

const AccountKeysBottomSheet: FC<Props> = ({
  sheetRef,
  closeBottomSheet,
  account,
  openAddAccountBottomSheet,
  showExportImport = false,
  removableKeys,
  chainId
}) => {
  const handleOpenAccountBottomSheet = useCallback(() => {
    closeBottomSheet()
    openAddAccountBottomSheet && openAddAccountBottomSheet()
  }, [closeBottomSheet, openAddAccountBottomSheet])
  const { theme } = useTheme()
  // Full width in the popup and in a narrow window (e.g. a request window), which are only a
  // little wider than the sheet, so it would be left hanging off one side
  const { isCompactLayout, isNarrowWebLayout } = useCompactLayout()
  const isFullWidth = isPopup || isNarrowWebLayout
  return (
    <BottomSheet
      id="account-keys-bottom-sheet"
      sheetRef={sheetRef}
      animationDuration={isWeb ? 0 : undefined}
      closeBottomSheet={closeBottomSheet}
      // A sheet as tall as its keys in the popup and narrow windows, so a single key doesn't
      // leave it mostly empty. In a wide tab it keeps a fixed minimum height
      scrollViewProps={isWeb && !isFullWidth ? { contentContainerStyle: { flex: 1 } } : undefined}
      isScrollEnabled={false}
      containerInnerWrapperStyles={isWeb && isFullWidth ? undefined : { flex: 1 }}
      style={getSheetStyle(isCompactLayout)}
      shouldBeClosableOnDrag={isMobile}
    >
      {!!account && (
        <AccountKeys
          account={account}
          openAddAccountBottomSheet={handleOpenAccountBottomSheet}
          closeBottomSheet={closeBottomSheet}
          keyIconColor={theme.iconPrimary as string}
          showExportImport={showExportImport}
          removableKeys={removableKeys}
          chainId={chainId}
          isFullWidthSheet={isFullWidth}
        />
      )}
    </BottomSheet>
  )
}

export default React.memo(AccountKeysBottomSheet)
