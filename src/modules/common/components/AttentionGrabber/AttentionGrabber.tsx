import { useCallback, useEffect, useMemo } from 'react'

import { useTranslation } from '@config/localization'
import useAuth from '@modules/auth/hooks/useAuth'
import useRequests from '@modules/common/hooks/useRequests'
import useToast from '@modules/common/hooks/useToast'

const stickyIds: string[] = []

const AttentionGrabber = ({ children }: any) => {
  const { addToast, removeToast } = useToast()
  const { t } = useTranslation()
  const { isAuthenticated } = useAuth()
  const { eligibleRequests, sendTxnState, setSendTxnState } = useRequests()
  const removeStickyToasts = useCallback(
    () => stickyIds.forEach((id) => removeToast(id)),
    [removeToast]
  )
  const isRouteWallet = useMemo(() => null, [])

  useEffect(() => {
    if (eligibleRequests.length && isAuthenticated) {
      if (sendTxnState.showing) removeStickyToasts()
      else {
        stickyIds.push(
          addToast(t('Transactions waiting to be signed') as string, {
            sticky: true,
            badge: eligibleRequests.length,
            onClick: () => setSendTxnState({ showing: true })
          })
        )
      }
    } else {
      removeStickyToasts()
    }
  }, [removeStickyToasts, eligibleRequests, sendTxnState, addToast, removeToast, isRouteWallet])

  return children
}

export default AttentionGrabber
