import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import useToast from '@common/hooks/useToast'
import { delayPromise } from '@common/utils/promises'

import { UseApprovalProps, UseApprovalReturnType } from './types'
import useSignApproval from './useSignApproval'

// In the cases when the dApp requests multiple approvals, but waits the
// response from the prev one to request the next one. For example
// this happens with https://polygonscan.com/ and https://bscscan.com/
// when you try to "Add Token to Web3 Wallet".
const MAGIC_DELAY_THAT_FIXES_CONCURRENT_DAPP_APPROVAL_REQUESTS = 850

const useApproval = ({
  requestNotificationServiceMethod,
  approval,
  setApproval
}: UseApprovalProps) => {
  const { t } = useTranslation()
  const { addToast } = useToast()

  const getApproval: UseApprovalReturnType['getApproval'] = useCallback(
    () =>
      requestNotificationServiceMethod({
        method: 'getApproval'
      }),
    [requestNotificationServiceMethod]
  )

  const resolveApproval = useCallback<UseApprovalReturnType['resolveApproval']>(
    async (data = undefined, stay = false, forceReject = false, approvalId = undefined) => {
      if (!approval) {
        return addToast(
          t(
            'Missing approval request from the dApp. Please close this window and trigger the action again from the dApp.'
          ),
          { error: true }
        )
      }

      await requestNotificationServiceMethod({
        method: 'resolveApproval',
        props: { data, forceReject, approvalId }
      })

      await delayPromise(MAGIC_DELAY_THAT_FIXES_CONCURRENT_DAPP_APPROVAL_REQUESTS)

      const nextApproval = await getApproval()
      setApproval(nextApproval)
    },
    [requestNotificationServiceMethod, addToast, approval, getApproval, t, setApproval]
  )

  const rejectApproval = useCallback<UseApprovalReturnType['rejectApproval']>(
    async (err = undefined, stay = false, isInternal = false) => {
      if (!approval) {
        return addToast(
          t(
            'Missing approval request from the dApp. Please close this window and trigger the action again from the dApp.'
          ),
          { error: true }
        )
      }

      await requestNotificationServiceMethod({
        method: 'rejectApproval',
        props: { err, stay, isInternal }
      })

      await delayPromise(MAGIC_DELAY_THAT_FIXES_CONCURRENT_DAPP_APPROVAL_REQUESTS)

      const nextApproval = await getApproval()
      setApproval(nextApproval)
    },
    [requestNotificationServiceMethod, approval, getApproval, addToast, t, setApproval]
  )

  const { requests, resolveMany, setRequests } = useSignApproval({
    approval,
    resolveApproval,
    rejectApproval
  })

  const rejectAllApprovals = useCallback(async () => {
    await requestNotificationServiceMethod({
      method: 'rejectAllApprovals'
    })
    setRequests([])
  }, [requestNotificationServiceMethod, setRequests])

  return {
    requests,
    getApproval,
    resolveApproval,
    rejectApproval,
    resolveMany,
    rejectAllApprovals
  }
}

export default useApproval
