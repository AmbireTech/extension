import React, { FC, useCallback, useState } from 'react'
import { Modalize } from 'react-native-modalize'

import { Account } from '@ambire-common/interfaces/account'
import { AccountKeyType } from '@common/components/AccountKey/AccountKey'
import BottomSheet from '@common/components/BottomSheet'
import { iconColors } from '@common/styles/themeConfig'

import AccountKeyDetails from './AccountKeyDetails'
import AccountKeys from './AccountKeys'

interface Props {
  sheetRef: React.RefObject<Modalize>
  closeBottomSheet: () => void
  account: Account
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
  const [currentKeyDetails, setCurrentKeyDetails] = useState<AccountKeyType | null>(null)

  const closeCurrentKeyDetails = useCallback(() => setCurrentKeyDetails(null), [])

  const closeBottomSheetWrapped = useCallback(() => {
    closeCurrentKeyDetails()
    closeBottomSheet()
  }, [closeBottomSheet, closeCurrentKeyDetails])

  const handleOpenAccountBottomSheet = useCallback(() => {
    closeBottomSheetWrapped()
    openAddAccountBottomSheet && openAddAccountBottomSheet()
  }, [closeBottomSheetWrapped, openAddAccountBottomSheet])

  return (
    <BottomSheet id="account-keys" sheetRef={sheetRef} closeBottomSheet={closeBottomSheetWrapped}>
      {!currentKeyDetails ? (
        <AccountKeys
          setCurrentKeyDetails={setCurrentKeyDetails}
          account={account}
          openAddAccountBottomSheet={handleOpenAccountBottomSheet}
          keyIconColor={iconColors.black}
          showExportImport={showExportImport}
        />
      ) : (
        <AccountKeyDetails
          details={currentKeyDetails}
          closeDetails={closeCurrentKeyDetails}
          account={account}
          keyIconColor={iconColors.black}
          showExportImport={showExportImport}
        />
      )}
    </BottomSheet>
  )
}

export default React.memo(AccountKeysBottomSheet)
