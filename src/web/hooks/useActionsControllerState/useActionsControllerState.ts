import { useContext } from 'react'

import { RequestsControllerStateContext } from '@web/contexts/requestsControllerStateContext'

export default function useActionsControllerState() {
  const context = useContext(RequestsControllerStateContext)

  if (!context) {
    throw new Error(
      'useActionsControllerState must be used within a RequestsControllerStateProvider'
    )
  }

  return context.actions || {}
}
