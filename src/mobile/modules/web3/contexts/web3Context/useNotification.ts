import { useCallback, useMemo } from 'react'

import NotificationService, {
  Approval
} from '@mobile/modules/web3/services/webview-background/services/notification'

const useNotification = ({ setApproval }: any) => {
  const requestNotificationApproval = useCallback(
    (approval: Approval | null) => {
      setApproval(approval)
    },
    [setApproval]
  )

  const notificationService: any = useMemo(
    () => new NotificationService({ requestNotificationApproval }),
    [requestNotificationApproval]
  )

  const requestNotificationServiceMethod = useCallback(
    ({ method, props }: { method: string; props?: { [key: string]: any } }) => {
      return notificationService[method](props)
    },
    [notificationService]
  )

  return {
    requestNotificationServiceMethod
  }
}

export default useNotification
