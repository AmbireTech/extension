import { useCallback, useEffect, useState } from 'react'

import { EstimationStatus } from '@ambire-common/controllers/estimation/types'
import { ISignAccountOpController } from '@ambire-common/interfaces/signAccountOp'
import { generateUuid } from '@ambire-common/utils/uuid'
import useController from '@common/hooks/useController'

/**
 * The onchain approval of a Safe transaction by one of its smart account owners: the owner the
 * user picked, whether its approval is still being prepared and, once it's estimated, the
 * approval to review and send from a bottom sheet
 */
const useSafeOwnerApproval = (signAccountOpState: ISignAccountOpController | null) => {
  const { dispatch: signAccountOpDispatch } = useController('SignAccountOpController')
  // Each press of Approve is a request of its own, so an approval prepared for an earlier one
  // (e.g. before the Safe transaction changed) is never shown for it
  const [request, setRequest] = useState<{
    ownerAddr: string
    id: string
    /** Its approval was shown, so later re-estimates of the fee don't hide it again */
    isShown: boolean
  } | null>(null)

  const approval = signAccountOpState?.safeOwnerApproval ?? null
  const isRequestDone = !!request && signAccountOpState?.safeOwnerApprovalRequestId === request.id
  const isApprovalOfRequest =
    isRequestDone && !!approval && approval.account.addr === request.ownerAddr
  const isApprovalEstimated =
    isApprovalOfRequest &&
    (approval.estimation.status === EstimationStatus.Success ||
      approval.estimation.status === EstimationStatus.Error)
  const hasPickedOwnerApproved =
    !!request &&
    (!!signAccountOpState?.pendingSafeOwnerApprovals.includes(request.ownerAddr) ||
      !!signAccountOpState?.accountOp.signed?.includes(request.ownerAddr))

  const isApprovalReady = isApprovalEstimated || (isApprovalOfRequest && !!request?.isShown)

  useEffect(() => {
    if (isApprovalEstimated)
      setRequest((prev) => (prev && !prev.isShown ? { ...prev, isShown: true } : prev))
  }, [isApprovalEstimated])

  // Sent, or it turned out to be approved already
  useEffect(() => {
    if (hasPickedOwnerApproved) setRequest(null)
  }, [hasPickedOwnerApproved])

  // Preparing it failed, so there's no approval to wait for
  useEffect(() => {
    if (isRequestDone && !isApprovalOfRequest) setRequest(null)
  }, [isRequestDone, isApprovalOfRequest])

  const startApproval = useCallback(
    (ownerAddr: string) => {
      const id = generateUuid()
      setRequest({ ownerAddr, id, isShown: false })
      signAccountOpDispatch({
        type: 'method',
        params: { method: 'initSafeOwnerApproval', args: [ownerAddr, id] }
      })
    },
    [signAccountOpDispatch]
  )

  const closeApproval = useCallback(() => setRequest(null), [])

  return {
    /**
     * The owner whose Approve button the user pressed, until the sheet is closed with Back or
     * the approval is sent. A sent one is in pendingSafeOwnerApprovals until it's confirmed
     */
    approvingOwnerAddr: request?.ownerAddr ?? null,
    approvalToReview: isApprovalReady && !hasPickedOwnerApproved ? approval : null,
    startApproval,
    closeApproval
  }
}

export default useSafeOwnerApproval
