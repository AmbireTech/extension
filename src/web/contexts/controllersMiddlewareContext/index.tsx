import { CommonControllersMiddlewareProvider } from '@web/contexts/controllersMiddlewareContext/commonControllersMiddlewareContext'
import { ExtensionControllersMiddlewareProvider } from '@web/contexts/controllersMiddlewareContext/extensionControllersMiddlewareContext'

import { ControllersMiddlewareContext } from './context'

const ControllersMiddlewareProvider: React.FC<{
  children: React.ReactNode
  env: 'extension' | 'mobile' | 'explorer' | 'rewards'
}> = ({ env, ...rest }) => {
  return env === 'extension' ? (
    <ExtensionControllersMiddlewareProvider {...rest} env="extension" />
  ) : (
    <CommonControllersMiddlewareProvider {...rest} env={env} />
  )
}

export { ControllersMiddlewareProvider, ControllersMiddlewareContext }
