import { useContext } from 'react'

import { ControllersMiddlewareContext } from '@web/contexts/controllersMiddlewareContext'

export default function useControllersMiddleware() {
  const context = useContext(ControllersMiddlewareContext)

  if (!context) {
    throw new Error('useControllersMiddleware must be used within a ControllersMiddlewareProvider')
  }

  return context
}
