import { useContext } from 'react'

import { ControllerStoreContext } from '@common/contexts/controllerStoreContext'

export default function useControllerStore() {
  const context = useContext(ControllerStoreContext)

  if (!context) {
    throw new Error('useControllerStore must be used within a ControllerStoreProvider')
  }

  return context
}
