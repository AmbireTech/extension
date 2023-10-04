import 'reflect-metadata'

import { ethErrors } from 'eth-rpc-errors'

import eventBus from '@mobile/modules/web3/services/event/eventBus'
import PromiseFlow from '@mobile/modules/web3/services/utils/promiseFlow'
import underline2Camelcase from '@mobile/modules/web3/services/utils/underline2Camelcase'
import providerController from '@mobile/modules/web3/services/webview-background/provider/ProviderController'
import { ProviderRequest } from '@mobile/modules/web3/services/webview-background/provider/types'

export const EVENTS = {
  broadcastToUI: 'broadcastToUI',
  broadcastToBackground: 'broadcastToBackground',
  TX_COMPLETED: 'TX_COMPLETED',
  SIGN_FINISHED: 'SIGN_FINISHED'
}

const isSignApproval = (type: string) => {
  const SIGN_APPROVALS = ['SignText', 'SignTypedData', 'SendTransaction']
  return SIGN_APPROVALS.includes(type)
}

const flow = new PromiseFlow<{
  request: ProviderRequest & {
    session: Exclude<ProviderRequest, void>
  }
  mapMethod: string
  approvalRes: any
  requestNotificationServiceMethod: ({
    method,
    props
  }: {
    method: string
    props?: { [key: string]: any }
  }) => any
}>()
const flowContext = flow
  .use(async (ctx, next) => {
    // check method
    const {
      data: { method }
    } = ctx.request
    ctx.mapMethod = underline2Camelcase(method)
    if (!providerController[ctx.mapMethod]) {
      if (method.startsWith('eth_') || method === 'net_version') {
        return providerController.ethRpc(ctx.request)
      }

      throw ethErrors.rpc.methodNotFound({
        message: `method [${method}] doesn't has corresponding handler`,
        data: ctx.request.data
      })
    }

    return next()
  })
  .use(async (ctx, next) => {
    // check need approval
    const {
      request: {
        data: { method, id },
        session: { origin, name, icon }
      },
      mapMethod,
      requestNotificationServiceMethod
    } = ctx
    const [approvalType, condition] =
      Reflect.getMetadata('APPROVAL', providerController, mapMethod) || []
    if (approvalType && (!condition || !condition(ctx.request))) {
      ctx.request.requestedApproval = true
      ctx.approvalRes = await requestNotificationServiceMethod({
        method: 'requestApproval',
        props: {
          approvalComponent: approvalType,
          params: {
            $ctx: ctx?.request?.data?.$ctx,
            method,
            id,
            data: ctx.request.data.params,
            session: { origin, name, icon }
          },
          origin
        }
      })
    }

    return next()
  })
  .use(async (ctx) => {
    const { approvalRes, mapMethod, request, requestNotificationServiceMethod } = ctx

    // process request
    const [approvalType] = Reflect.getMetadata('APPROVAL', providerController, mapMethod) || []
    const { uiRequestComponent, ...rest } = approvalRes || {}
    const {
      session: { origin }
    } = request
    const requestDefer = Promise.resolve(
      providerController[mapMethod]({
        ...request,
        approvalRes
      })
    )

    requestDefer
      .then((result) => {
        if (isSignApproval(approvalType)) {
          eventBus.emit(EVENTS.broadcastToUI, {
            method: EVENTS.SIGN_FINISHED,
            params: {
              success: true,
              data: result
            }
          })
        }
        return result
      })
      .catch((e: any) => {
        if (isSignApproval(approvalType)) {
          eventBus.emit(EVENTS.broadcastToUI, {
            method: EVENTS.SIGN_FINISHED,
            params: {
              success: false,
              errorMsg: JSON.stringify(e)
            }
          })
        }
      })
    async function requestApprovalLoop({ uiRequestComponent, ...rest }) {
      ctx.request.requestedApproval = true

      const res = await requestNotificationServiceMethod({
        method: 'requestApproval',
        props: {
          approvalComponent: uiRequestComponent,
          params: rest,
          origin,
          approvalType,
          isUnshift: true
        }
      })

      if (res.uiRequestComponent) {
        return await requestApprovalLoop(res)
      }
      return res
    }
    if (uiRequestComponent) {
      ctx.request.requestedApproval = true
      return await requestApprovalLoop({ uiRequestComponent, ...rest })
    }

    return requestDefer
  })
  .callback()

export default (
  request: ProviderRequest,
  requestNotificationServiceMethod: ({
    method,
    props
  }: {
    method: string
    props?: { [key: string]: any }
  }) => any
) => {
  const ctx: any = {
    request: { ...request, requestedApproval: false },
    requestNotificationServiceMethod
  }
  return flowContext(ctx).finally(() => {
    if (ctx.request.requestedApproval) {
      flow.requestedApproval = false
      // only unlock notification if current flow is an approval flow
      requestNotificationServiceMethod({
        method: 'unLock'
      })
    }
  })
}
