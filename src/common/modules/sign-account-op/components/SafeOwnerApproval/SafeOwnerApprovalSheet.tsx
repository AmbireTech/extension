import React, { Suspense, useCallback } from 'react'
import { useModalize } from 'react-native-modalize'

import { ISignAccountOpController } from '@ambire-common/interfaces/signAccountOp'
import OneClickEstimation from '@common/modules/sign-account-op/components/OneClick/Estimation'
import { ModalsProps } from '@common/modules/sign-account-op/types/modals'

type Props = {
  /** The approval to review, see useSafeOwnerApproval. The sheet opens once it's mounted */
  approval: ISignAccountOpController
  onClose: () => void
  Modals: React.ComponentType<ModalsProps>
}

/**
 * Shows the fee, the signing and the sending of the transaction a smart account owner of a Safe
 * approves the Safe transaction with, while the Safe transaction stays on screen behind it
 */
const SafeOwnerApprovalSheet = ({ approval, onClose, Modals }: Props) => {
  const { ref: sheetRef, close: closeSheet } = useModalize()
  const handleClose = useCallback(() => {
    closeSheet()
    onClose()
  }, [closeSheet, onClose])

  return (
    // lazy loaded on web
    <Suspense fallback={null}>
      <OneClickEstimation
      updateType="SafeOwnerApproval"
      estimationModalRef={sheetRef}
      closeEstimationModal={handleClose}
      onEstimationModalClosed={onClose}
      hasProceeded
      signAccountOpController={approval}
      shouldShowTxnDetails
      Modals={Modals}
      />
    </Suspense>
  )
}

export default React.memo(SafeOwnerApprovalSheet)
