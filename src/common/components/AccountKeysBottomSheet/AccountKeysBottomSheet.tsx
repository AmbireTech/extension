import React, { FC, useCallback } from 'react'
import { Modalize } from 'react-native-modalize'

import { Account } from '@ambire-common/interfaces/account'
import AccountKeys from '@common/components/AccountKeysBottomSheet/AccountKeys'
import BottomSheet from '@common/components/BottomSheet'
import { isMobile, isWeb } from '@common/config/env'
import useCompactLayout from '@common/hooks/useCompactLayout'
import useTheme from '@common/hooks/useTheme'
import { getUiType } from '@common/utils/uiType'
import spacings from '@common/styles/spacings'

interface Props {
  sheetRef: React.RefObject<Modalize>
  closeBottomSheet: () => void
  account: Account | null
  openAddAccountBottomSheet?: () => void
  showExportImport?: boolean
  /** Lets the user remove imported keys, see `AccountKeys` */
  canRemoveKeys?: boolean
  chainId?: bigint
}

const AccountKeysBottomSheet: FC<Props> = ({
  sheetRef,
  closeBottomSheet,
  account,
  openAddAccountBottomSheet,
  showExportImport = false,
  canRemoveKeys = false,
  chainId
}) => {
  const handleOpenAccountBottomSheet = useCallback(() => {
    closeBottomSheet()
    openAddAccountBottomSheet && openAddAccountBottomSheet()
  }, [closeBottomSheet, openAddAccountBottomSheet])
  const { theme } = useTheme()
  // Full width in the popup and in a narrow window (e.g. a request window), which are only a
  // little wider than the sheet, so it would be left hanging off one side
  const { isNarrowWebLayout } = useCompactLayout()
  const isFullWidth = getUiType().isPopup || isNarrowWebLayout
  return (
    <BottomSheet
      id="account-keys-bottom-sheet"
      sheetRef={sheetRef}
      animationDuration={isWeb ? 0 : undefined}
      closeBottomSheet={closeBottomSheet}
      scrollViewProps={isWeb ? { contentContainerStyle: { flex: 1 } } : undefined}
      isScrollEnabled={false}
      containerInnerWrapperStyles={{ flex: 1 }}
      style={
        isWeb
          ? { ...(!isFullWidth && { maxWidth: 432 }), minHeight: 432, ...spacings.pvLg }
          : undefined
      }
      shouldBeClosableOnDrag={isMobile}
    >
      {!!account && (
        <AccountKeys
          account={account}
          openAddAccountBottomSheet={handleOpenAccountBottomSheet}
          closeBottomSheet={closeBottomSheet}
          keyIconColor={theme.iconPrimary as string}
          showExportImport={showExportImport}
          canRemoveKeys={canRemoveKeys}
          chainId={chainId}
        />
      )}
    </BottomSheet>
  )
}

export default React.memo(AccountKeysBottomSheet)
