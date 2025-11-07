import React, { FC, useCallback } from 'react'
import { Modalize } from 'react-native-modalize'

import { Account } from '@ambire-common/interfaces/account'
import AccountKeys from '@common/components/AccountKeysBottomSheet/AccountKeys'
import BottomSheet from '@common/components/BottomSheet'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'

interface Props {
  sheetRef: React.RefObject<Modalize>
  closeBottomSheet: () => void
  account: Account | null
  openAddAccountBottomSheet?: () => void
  showExportImport?: boolean
}

const AccountKeysBottomSheet: FC<Props> = ({
  sheetRef,
  closeBottomSheet,
  account,
  openAddAccountBottomSheet,
  showExportImport = false
}) => {
  const handleOpenAccountBottomSheet = useCallback(() => {
    closeBottomSheet()
    openAddAccountBottomSheet && openAddAccountBottomSheet()
  }, [closeBottomSheet, openAddAccountBottomSheet])
  const { theme, themeType } = useTheme()
  return (
    <BottomSheet
      id="account-keys-bottom-sheet"
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
      backgroundColor={themeType === THEME_TYPES.DARK ? 'secondaryBackground' : 'primaryBackground'}
      scrollViewProps={{ contentContainerStyle: { flex: 1 } }}
      isScrollEnabled={false}
      containerInnerWrapperStyles={{ flex: 1 }}
      style={{ maxWidth: 432, minHeight: 432, ...spacings.pvLg }}
      shouldBeClosableOnDrag={false}
    >
      {!!account && (
        <AccountKeys
          account={account}
          openAddAccountBottomSheet={handleOpenAccountBottomSheet}
          closeBottomSheet={closeBottomSheet}
          keyIconColor={theme.iconPrimary as string}
          showExportImport={showExportImport}
        />
      )}
    </BottomSheet>
  )
}

export default React.memo(AccountKeysBottomSheet)
