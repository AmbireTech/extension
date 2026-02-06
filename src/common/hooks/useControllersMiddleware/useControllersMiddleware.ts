import { useContext } from 'react'

import { ControllersMiddlewareContext } from '@common/contexts/controllersMiddlewareContext/context'

export default function useControllersMiddleware() {
  const context = useContext(ControllersMiddlewareContext)

  if (!context) {
    throw new Error('useControllersMiddleware must be used within a ControllersMiddlewareProvider')
  }

  return context
}
