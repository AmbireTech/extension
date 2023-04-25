import { useContext } from 'react'

import { NotificationContext } from '@mobile/modules/web3/contexts/notificationContext'

export default function useNotification() {
  const context = useContext(NotificationContext)

  if (!context) {
    throw new Error('useNotification must be used within an NotificationProvider')
  }

  return context
}
