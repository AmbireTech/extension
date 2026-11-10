import { useCallback } from 'react'

import useController from '@common/hooks/useController'
import type { Props as EstimationProps } from '@common/modules/sign-account-op/components/Estimation/types'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

type SignAccountOpControllerType = AllControllersMappingType['SignAccountOpController']
type SignAccountOpMethods = {
  [K in keyof SignAccountOpControllerType as SignAccountOpControllerType[K] extends (
    ...args: any
  ) => any
    ? K
    : never]: SignAccountOpControllerType[K]
}

/**
 * Calls a method of the transaction being signed. One-click transfers and swaps own their
 * transaction, so the call goes through their controller instead of the sign screen's one
 */
const useSignAccountOpMethodDispatch = (updateType: EstimationProps['updateType'] = 'Requests') => {
  const { dispatch: signAccountOpDispatch } = useController('SignAccountOpController')
  const { dispatch: swapAndBridgeDispatch } = useController('SwapAndBridgeController')
  const { dispatch: transferDispatch } = useController('TransferController')

  return useCallback(
    <M extends keyof SignAccountOpMethods>(
      method: M,
      args: Parameters<SignAccountOpMethods[M]>
    ) => {
      if (updateType === 'Swap&Bridge') {
        swapAndBridgeDispatch({
          type: 'method',
          params: { method: 'callSignAccountOpMethod', args: [method, args] }
        })
        return
      }

      if (updateType === 'Transfer&TopUp') {
        transferDispatch({
          type: 'method',
          params: { method: 'callSignAccountOpMethod', args: [method, args] }
        })
        return
      }

      signAccountOpDispatch({ type: 'method', params: { method, args } } as Parameters<
        typeof signAccountOpDispatch
      >[0])
    },
    [signAccountOpDispatch, swapAndBridgeDispatch, transferDispatch, updateType]
  )
}

export default useSignAccountOpMethodDispatch
