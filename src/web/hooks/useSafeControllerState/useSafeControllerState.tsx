import { useContext } from 'react'

import { SafeControllerStateContext } from '@web/contexts/safeControllerStateContext'

export default function useSafeControllerState() {
  const context = useContext(SafeControllerStateContext)

  if (!context) {
    throw new Error('useSafeControllerState must be used within a SafeControllerStateContext')
  }

  return context
}
