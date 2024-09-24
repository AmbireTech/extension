import React, { FC, useState } from 'react'
import { Modalize } from 'react-native-modalize'

import { Key } from '@ambire-common/interfaces/keystore'
import { AccountKeyType } from '@common/components/AccountKey/AccountKey'
import BottomSheet from '@common/components/BottomSheet'

import AccountKeyDetails from './AccountKeyDetails'
import AccountKeys from './AccountKeys'

interface Props {
  sheetRef: React.RefObject<Modalize>
  associatedKeys: string[]
  importedAccountKeys: Key[]
  closeBottomSheet: () => void
}

const AccountKeysBottomSheet: FC<Props> = ({
  sheetRef,
  associatedKeys,
  importedAccountKeys,
  closeBottomSheet
}) => {
  const [currentKeyDetails, setCurrentKeyDetails] = useState<AccountKeyType | null>(null)

  const closeCurrentKeyDetails = () => setCurrentKeyDetails(null)

  const closeBottomSheetWrapped = () => {
    closeCurrentKeyDetails()
    closeBottomSheet()
  }

  return (
    <BottomSheet id="account-keys" sheetRef={sheetRef} closeBottomSheet={closeBottomSheetWrapped}>
      {!currentKeyDetails ? (
        <AccountKeys
          associatedKeys={associatedKeys}
          importedAccountKeys={importedAccountKeys}
          setCurrentKeyDetails={setCurrentKeyDetails}
        />
      ) : (
        <AccountKeyDetails details={currentKeyDetails} closeDetails={closeCurrentKeyDetails} />
      )}
    </BottomSheet>
  )
}

export default React.memo(AccountKeysBottomSheet)
