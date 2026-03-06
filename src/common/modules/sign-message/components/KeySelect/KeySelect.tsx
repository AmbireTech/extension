import React from 'react'

import { Account } from '@ambire-common/interfaces/account'
import { Key } from '@ambire-common/interfaces/keystore'
import MultipleSignersSelect from '@common/modules/sign-message/components/SafeSignersSelect'
import SigningKeySelect from '@common/modules/sign-message/components/SignKeySelect'

const KeySelect = ({
  isChooseSignerShown,
  isChooseFeePayerKeyShown,
  isSigning,
  handleClose,
  handleSetMultisigSigners,
  handleChooseKey,
  account,
  selectedAccountKeyStoreKeys,
  signed,
  threshold
}: {
  isChooseSignerShown: boolean
  isChooseFeePayerKeyShown: boolean
  isSigning: boolean
  handleClose: () => void
  handleSetMultisigSigners: (signers: { addr: Key['addr']; type: Key['type'] }[]) => void
  handleChooseKey: (keyAddr: Key['addr'], keyType: Key['type']) => void
  account: Account
  selectedAccountKeyStoreKeys: Key[]
  signed: string[]
  threshold: number
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
      {!!account.safeCreation ? (
        <MultipleSignersSelect
          isVisible={isChooseSignerShown}
          isSigning={isSigning}
          handleSetMultisigSigners={handleSetMultisigSigners}
          handleClose={handleClose}
          account={account}
          selectedAccountKeyStoreKeys={selectedAccountKeyStoreKeys}
          signed={signed}
          threshold={threshold}
        />
      ) : null}
    </>
  )
}

export default KeySelect
