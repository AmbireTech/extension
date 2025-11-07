import { useContext } from 'react'

import { UiControllerStateContext } from '@web/contexts/uiControllerStateContext'

export default function useUiControllerState() {
  const context = useContext(UiControllerStateContext)

  if (!context) {
    throw new Error('useUiControllerState must be used within a UiControllerStateProvider')
  }

  return context
}
