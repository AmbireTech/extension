// @ts-nocheck
import internalMethods from '@mobile/modules/web3/services/webview-background/provider/internalMethods'
import rpcFlow from '@mobile/modules/web3/services/webview-background/provider/rpcFlow'
import { ProviderRequest } from '@mobile/modules/web3/services/webview-background/provider/types'

export default async <T = void>(
  req: ProviderRequest,
  requestNotificationServiceMethod: ({
    method,
    props
  }: {
    method: string
    props?: { [key: string]: any }
  }) => any
): Promise<T> => {
  const {
    data: { method }
  } = req

  if (internalMethods[method]) {
    return internalMethods[method](req)
  }

  return rpcFlow(req, requestNotificationServiceMethod) as any
}
