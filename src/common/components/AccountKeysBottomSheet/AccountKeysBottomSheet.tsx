import React, { FC, useCallback } from 'react'
import { Modalize } from 'react-native-modalize'

import { Account } from '@ambire-common/interfaces/account'
import AccountKeys from '@common/components/AccountKeysBottomSheet/AccountKeys'
import BottomSheet from '@common/components/BottomSheet'
import { isMobile, isWeb } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'

interface Props {
  sheetRef: React.RefObject<Modalize>
  closeBottomSheet: () => void
  account: Account | null
  openAddAccountBottomSheet?: () => void
  showExportImport?: boolean
  chainId?: bigint
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
  return (
    <BottomSheet
      id="account-keys-bottom-sheet"
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
      scrollViewProps={isWeb ? { contentContainerStyle: { flex: 1 } } : undefined}
      isScrollEnabled={false}
      containerInnerWrapperStyles={{ flex: 1 }}
      style={isWeb ? { maxWidth: 492, minHeight: 432, ...spacings.pvLg } : undefined}
      shouldBeClosableOnDrag={isMobile}
    >
      {!!account && (
        <AccountKeys
          account={account}
          openAddAccountBottomSheet={handleOpenAccountBottomSheet}
          closeBottomSheet={closeBottomSheet}
          keyIconColor={theme.iconPrimary as string}
          showExportImport={showExportImport}
          chainId={chainId}
        />
      )}
    </BottomSheet>
  )
}

export default React.memo(AccountKeysBottomSheet)
