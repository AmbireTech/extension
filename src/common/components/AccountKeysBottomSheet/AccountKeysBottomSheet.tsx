import React, { FC, useCallback } from 'react'

import { Account } from '@ambire-common/interfaces/account'
import AccountKeys from '@common/components/AccountKeysBottomSheet/AccountKeys'
import BottomSheet from '@common/components/BottomSheet'
import type { SheetRef } from '@common/components/BottomSheet/useSheetRef'
import { isMobile, isWeb } from '@common/config/env'
import useCompactLayout from '@common/hooks/useCompactLayout'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { getUiType } from '@common/utils/uiType'

interface Props {
  sheetRef: React.RefObject<SheetRef | null>
  closeBottomSheet: () => void
  account: Account | null
  openAddAccountBottomSheet?: () => void
  showExportImport?: boolean
  chainId?: bigint
}

const { isPopup } = getUiType()

// A compact view shows a full-width bottom sheet, so only a wider layout gets the minimum height.
// The width cap fits only a centered modal. In the popup this sheet is a bottom sheet, which the
// cap would leave narrower than the popup and pinned to its left edge
const WIDE_LAYOUT_SHEET_STYLE = {
  minHeight: 432,
  ...spacings.pvLg,
  ...(isPopup ? {} : { maxWidth: 432 })
}

const AccountKeysBottomSheet: FC<Props> = ({
  sheetRef,
  closeBottomSheet,
  account,
  openAddAccountBottomSheet,
  showExportImport = false,
  chainId
}) => {
  const handleOpenAccountBottomSheet = useCallback(() => {
    closeBottomSheet()
    openAddAccountBottomSheet && openAddAccountBottomSheet()
  }, [closeBottomSheet, openAddAccountBottomSheet])
  const { theme } = useTheme()
  const { isCompactLayout } = useCompactLayout()
  return (
    <BottomSheet
      id="account-keys-bottom-sheet"
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
      scrollViewProps={isWeb ? { contentContainerStyle: { flex: 1 } } : undefined}
      isScrollEnabled={false}
      containerInnerWrapperStyles={{ flex: 1 }}
      style={isCompactLayout ? undefined : WIDE_LAYOUT_SHEET_STYLE}
      shouldBeClosableOnDrag={isMobile}
    >
      {!!account && (
        <AccountKeys
          account={account}
          openAddAccountBottomSheet={handleOpenAccountBottomSheet}
          keyIconColor={theme.iconPrimary as string}
          showExportImport={showExportImport}
          chainId={chainId}
        />
      )}
    </BottomSheet>
  )
}

export default React.memo(AccountKeysBottomSheet)
