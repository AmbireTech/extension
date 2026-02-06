import React from 'react'

import { Key } from '@ambire-common/interfaces/keystore'
import useSignAccountOpControllerState from '@web/hooks/useSignAccountOpControllerState'

import MultipleSignersSelect from '../SafeSignersSelect'
import SigningKeySelect from '../SignKeySelect'

const KeySelect = ({
  isChooseSignerShown,
  isChooseFeePayerKeyShown,
  isSignLoading,
  setIsChooseSignerShown,
  setIsChooseFeePayerKeyShown,
  handleChangeFeePayerKeyType,
  handleChangeSigningKey,
  handleSetMultisigSigners
}: {
  isChooseSignerShown: boolean
  isChooseFeePayerKeyShown: boolean
  isSignLoading: boolean
  setIsChooseSignerShown: Function
  setIsChooseFeePayerKeyShown: Function
  handleChangeFeePayerKeyType: (keyAddr: Key['addr'], keyType: Key['type']) => void
  handleChangeSigningKey: (keyAddr: Key['addr'], keyType: Key['type']) => void
  handleSetMultisigSigners: (signers: { addr: Key['addr']; type: Key['type'] }[]) => void
}) => {
  const signAccountOpState = useSignAccountOpControllerState()
  if (!signAccountOpState) return null

  return (
    <>
      <SigningKeySelect
        isVisible={
          (isChooseSignerShown && !signAccountOpState.account.safeCreation) ||
          isChooseFeePayerKeyShown
        }
        isSigning={isSignLoading || !signAccountOpState.readyToSign}
        handleClose={() => {
          setIsChooseSignerShown(false)
          setIsChooseFeePayerKeyShown(false)
        }}
        selectedAccountKeyStoreKeys={
          isChooseFeePayerKeyShown
            ? signAccountOpState.feePayerKeyStoreKeys
            : signAccountOpState.accountKeyStoreKeys
        }
        handleChooseKey={
          isChooseFeePayerKeyShown ? handleChangeFeePayerKeyType : handleChangeSigningKey
        }
        type={isChooseFeePayerKeyShown ? 'broadcasting' : 'signing'}
        account={signAccountOpState.account}
      />
      {!!signAccountOpState.account.safeCreation ? (
        <MultipleSignersSelect
          isVisible={isChooseSignerShown}
          isSigning={isSignLoading || !signAccountOpState.readyToSign}
          handleSetMultisigSigners={handleSetMultisigSigners}
          handleClose={() => {
            setIsChooseSignerShown(false)
          }}
        />
      ) : null}
    </>
  )
}

export default KeySelect
