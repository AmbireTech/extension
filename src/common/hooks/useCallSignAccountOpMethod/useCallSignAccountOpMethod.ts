import { useCallback } from 'react'

import { SignAccountOpType } from '@ambire-common/controllers/signAccountOp/helper'
import {
  SafeOwnerApprovalUiMethod,
  SignAccountOpController
} from '@ambire-common/controllers/signAccountOp/signAccountOp'
import useController from '@common/hooks/useController'

/** The flows whose SignAccountOpController is shown in a sign or one-click estimation screen */
export type SignAccountOpUpdateType = 'Requests' | 'Swap&Bridge' | 'Transfer&TopUp' | 'SafeOwnerApproval'

/** Which SignAccountOpController a screen of the given flow shows */
export const getSignAccountOpType = (updateType?: SignAccountOpUpdateType): SignAccountOpType => {
  if (updateType === 'Swap&Bridge') return 'one-click-swap-and-bridge'
  if (updateType === 'Transfer&TopUp') return 'one-click-transfer'
  if (updateType === 'SafeOwnerApproval') return 'safe-owner-approval'

  return 'default'
}

/**
 * Calls a method of the SignAccountOpController of the given flow. Each flow keeps its
 * controller in a different place: the transfer and swap & bridge controllers own theirs, and
 * the approval of a Safe smart account owner lives in the Safe request's controller
 */
const useCallSignAccountOpMethod = (type: SignAccountOpType = 'default') => {
  const { dispatch: signAccountOpDispatch } = useController('SignAccountOpController')
  const { dispatch: swapAndBridgeDispatch } = useController('SwapAndBridgeController')
  const { dispatch: transferDispatch } = useController('TransferController')

  return useCallback(
    <M extends SafeOwnerApprovalUiMethod>(
      method: M,
      args: Parameters<SignAccountOpController[M]>
    ) => {
      if (type === 'one-click-swap-and-bridge') {
        swapAndBridgeDispatch({
          type: 'method',
          params: { method: 'callSignAccountOpMethod', args: [method, args] }
        })
        return
      }

      if (type === 'one-click-transfer') {
        transferDispatch({
          type: 'method',
          params: { method: 'callSignAccountOpMethod', args: [method, args] }
        })
        return
      }

      if (type === 'safe-owner-approval') {
        signAccountOpDispatch({
          type: 'method',
          params: { method: 'callSafeOwnerApprovalMethod', args: [method, args] }
        })
        return
      }

      signAccountOpDispatch({
        type: 'method',
        params: { method, args } as never
      })
    },
    [signAccountOpDispatch, swapAndBridgeDispatch, transferDispatch, type]
  )
}

export default useCallSignAccountOpMethod
