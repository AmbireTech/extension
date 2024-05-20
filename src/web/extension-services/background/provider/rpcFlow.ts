/* eslint-disable @typescript-eslint/no-floating-promises */
import 'reflect-metadata'

import { ethErrors } from 'eth-rpc-errors'

import { DappProviderRequest } from '@ambire-common/interfaces/dapp'
import { ProviderController } from '@web/extension-services/background/provider/ProviderController'
import {
  ProviderNeededControllers,
  RequestRes
} from '@web/extension-services/background/provider/types'
import PromiseFlow from '@web/utils/promiseFlow'
import underline2Camelcase from '@web/utils/underline2Camelcase'

const lockedOrigins = new Set<string>()
const connectOrigins = new Set<string>()

const flow = new PromiseFlow<{
  request: DappProviderRequest
  controllers: ProviderNeededControllers
  mapMethod: string
  requestRes?: RequestRes
}>()

const flowContext = flow
  // validate the provided method
  .use(async ({ request, controllers, mapMethod }, next) => {
    const { mainCtrl, dappsCtrl } = controllers
    const { method, params } = request
    const providerCtrl = new ProviderController(mainCtrl, dappsCtrl)
    if (!(providerCtrl as any)[mapMethod]) {
      if (method.startsWith('eth_') || method === 'net_version') {
        return providerCtrl.ethRpc(request)
      }

      throw ethErrors.rpc.methodNotFound({
        message: `method [${method}] doesn't has corresponding handler`,
        data: { method, params }
      })
    }

    return next()
  })
  // unlock the wallet before proceeding with the request
  .use(async ({ request, controllers, mapMethod }, next) => {
    const { mainCtrl, dappsCtrl } = controllers
    const {
      session: { origin }
    } = request

    const providerCtrl = new ProviderController(mainCtrl, dappsCtrl)
    if (!Reflect.getMetadata('SAFE', providerCtrl, mapMethod)) {
      const isUnlock = mainCtrl.keystore.isReadyToStoreKeys ? mainCtrl.keystore.isUnlocked : true

      if (!isUnlock && dappsCtrl.hasPermission(origin)) {
        if (lockedOrigins.has(origin)) {
          throw ethErrors.rpc.resourceNotFound('Already processing unlock. Please wait.')
        }
        lockedOrigins.add(origin)
        try {
          await new Promise((resolve, reject) => {
            mainCtrl.buildUserRequest(
              { ...request, method: 'unlock', params: {} },
              { resolve, reject }
            )
          })
          lockedOrigins.delete(origin)
        } catch (e) {
          lockedOrigins.delete(origin)
          throw e
        }
      }
    }

    return next()
  })
  // if dApp not connected - prompt connect action window
  .use(async ({ request, controllers, mapMethod }, next) => {
    const { mainCtrl, dappsCtrl } = controllers
    const {
      session: { origin, name, icon }
    } = request
    const providerCtrl = new ProviderController(mainCtrl, dappsCtrl)
    if (!Reflect.getMetadata('SAFE', providerCtrl, mapMethod)) {
      if (!dappsCtrl.hasPermission(origin)) {
        if (connectOrigins.has(origin)) {
          throw ethErrors.rpc.resourceNotFound('Already processing connect. Please wait.')
        }
        try {
          connectOrigins.add(origin)
          await new Promise((resolve, reject) => {
            mainCtrl.buildUserRequest(
              { ...request, method: 'dapp_connect', params: {} },
              { resolve, reject }
            )
          })
          connectOrigins.delete(origin)
          dappsCtrl.addDapp({
            name,
            url: origin,
            icon,
            description: 'Custom dApp automatically added when connected for the first time.',
            favorite: false,
            chainId: 1,
            isConnected: true
          })
        } catch (e) {
          connectOrigins.delete(origin)
          throw e
        }
      }
    }

    return next()
  })
  // add the dapp request as a userRequest and action
  .use(async (props, next) => {
    const { request, controllers, mapMethod } = props
    const { mainCtrl, dappsCtrl } = controllers
    const providerCtrl = new ProviderController(mainCtrl, dappsCtrl)
    const [requestType, condition] =
      Reflect.getMetadata('NOTIFICATION_REQUEST', providerCtrl, mapMethod) || []
    if (requestType && (!condition || !condition(props))) {
      // eslint-disable-next-line no-param-reassign
      props.requestRes = await new Promise((resolve, reject) => {
        mainCtrl.buildUserRequest(request, { resolve, reject })
      })
    }

    return next()
  })
  .use(async ({ request, controllers, mapMethod, requestRes }) => {
    const { mainCtrl, dappsCtrl } = controllers
    const providerCtrl = new ProviderController(mainCtrl, dappsCtrl)

    return Promise.resolve((providerCtrl as any)[mapMethod]({ ...request, requestRes }))
  })
  .callback()

export default (request: DappProviderRequest, controllers: ProviderNeededControllers) => {
  return flowContext({ request, controllers, mapMethod: underline2Camelcase(request.method) })
}
