import React from 'react'

import { Account } from '@ambire-common/interfaces/account'
import { Key } from '@ambire-common/interfaces/keystore'

import SigningKeySelect from '../SignKeySelect'

const KeySelect = ({
  isChooseSignerShown,
  isChooseFeePayerKeyShown,
  isSigning,
  handleClose,
  handleChooseKey,
  account,
  selectedAccountKeyStoreKeys
}: {
  isChooseSignerShown: boolean
  isChooseFeePayerKeyShown: boolean
  isSigning: boolean
  handleClose: () => void
  handleChooseKey: (keyAddr: Key['addr'], keyType: Key['type']) => void
  account: Account
  selectedAccountKeyStoreKeys: Key[]
}) => {
  return (
    <>
      <SigningKeySelect
        isVisible={(isChooseSignerShown && !account.safeCreation) || isChooseFeePayerKeyShown}
        isSigning={isSigning}
        handleClose={handleClose}
        selectedAccountKeyStoreKeys={selectedAccountKeyStoreKeys}
        handleChooseKey={handleChooseKey}
        type={isChooseFeePayerKeyShown ? 'broadcasting' : 'signing'}
        account={account}
      />
    </>
  )
}

export default KeySelect
