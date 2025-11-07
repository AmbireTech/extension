import { useContext } from 'react'

import { RequestsControllerStateContext } from '@web/contexts/requestsControllerStateContext'

export default function useRequestsControllerState() {
  const context = useContext(RequestsControllerStateContext)

  if (!context) {
    throw new Error(
      'useRequestsControllerState must be used within a RequestsControllerStateProvider'
    )
  }

  return context
}
