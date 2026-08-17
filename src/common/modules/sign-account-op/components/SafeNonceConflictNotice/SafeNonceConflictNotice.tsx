import React, { useCallback, useMemo } from 'react'

import { getAccountOpNonce } from '@ambire-common/libs/accountOp/accountOp'
import useController from '@common/hooks/useController'
import SafetyChecksBanner, {
  type SafetyCheckBannerAction
} from '@common/modules/sign-account-op/components/SafetyChecksBanner'
import spacings from '@common/styles/spacings'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectCurrentSafeNonceConflict = (state: AllControllersMappingType['RequestsController']) =>
  state.currentSafeNonceConflict

const selectAccountOp = (state: AllControllersMappingType['SignAccountOpController']) =>
  state.accountOp

const selectFromRequestId = (state: AllControllersMappingType['SignAccountOpController']) =>
  state.fromRequestId

const SafeNonceConflictNotice = () => {
  const { state: conflict, dispatch } = useController(
    'RequestsController',
    selectCurrentSafeNonceConflict
  )
  const { state: accountOp } = useController('SignAccountOpController', selectAccountOp)
  const { state: fromRequestId } = useController('SignAccountOpController', selectFromRequestId)

  const handleSetNewNonce = useCallback(() => {
    dispatch({
      type: 'method',
      params: {
        method: 'setCurrentRequestSafeNonceToNextAvailable',
        args: []
      }
    })
  }, [dispatch])

  const handleReplaceExisting = useCallback(() => {
    dispatch({
      type: 'method',
      params: {
        method: 'dismissCurrentSafeNonceConflict',
        args: []
      }
    })
  }, [dispatch])

  const primaryAction = useMemo<SafetyCheckBannerAction>(
    () => ({
      id: 'safe-nonce-conflict-set-new-nonce',
      text: 'Set new nonce',
      onPress: handleSetNewNonce
    }),
    [handleSetNewNonce]
  )

  const secondaryActions = useMemo<SafetyCheckBannerAction[]>(
    () => [
      {
        id: 'safe-nonce-conflict-replace-existing',
        text: 'Replace existing',
        onPress: handleReplaceExisting
      }
    ],
    [handleReplaceExisting]
  )

  if (
    !conflict ||
    !accountOp ||
    conflict.requestId !== fromRequestId ||
    conflict.nonce !== getAccountOpNonce(accountOp) ||
    accountOp.signed?.length ||
    accountOp.safeTx?.confirmations?.length
  )
    return null

  return (
    <SafetyChecksBanner
      type="warning"
      title="Pending transaction for this nonce detected"
      text="Another pending transaction is using this transaction number. Choose the next available number, or continue to replace it."
      primaryAction={primaryAction}
      secondaryActions={secondaryActions}
      style={spacings.mbTy}
    />
  )
}

export default React.memo(SafeNonceConflictNotice)
