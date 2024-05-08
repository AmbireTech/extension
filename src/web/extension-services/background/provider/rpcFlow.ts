import 'reflect-metadata'

import { ethErrors } from 'eth-rpc-errors'

import { delayPromise } from '@common/utils/promises'
import { ProviderController } from '@web/extension-services/background/provider/ProviderController'
import {
  ProviderNeededControllers,
  ProviderRequest,
  RequestRes
} from '@web/extension-services/background/provider/types'
import PromiseFlow from '@web/utils/promiseFlow'
import underline2Camelcase from '@web/utils/underline2Camelcase'

const lockedOrigins = new Set<string>()
const connectOrigins = new Set<string>()

const flow = new PromiseFlow<{
  request: ProviderRequest
  controllers: ProviderNeededControllers
  mapMethod: string
  requestRes?: RequestRes
}>()

const flowContext = flow
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
  .use(async ({ request, controllers, mapMethod }, next) => {
    const { mainCtrl, dappsCtrl, notificationCtrl } = controllers
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
          await notificationCtrl.requestNotificationRequest({ ...request, screen: 'Unlock' })
          lockedOrigins.delete(origin)
        } catch (e) {
          lockedOrigins.delete(origin)
          throw e
        }
        // awaits the notification ctrl to resolve with this request before continuing with the actual dapp req
        await delayPromise(350)
      }
    }

    return next()
  })
  .use(async ({ request, controllers, mapMethod }, next) => {
    // check connect
    const { mainCtrl, dappsCtrl, notificationCtrl } = controllers
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
          await notificationCtrl.requestNotificationRequest({
            ...request,
            screen: 'DappConnectRequest'
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
  .use(async (props, next) => {
    // check need notification request
    const { request, controllers, mapMethod } = props
    const { mainCtrl, dappsCtrl, notificationCtrl } = controllers
    const providerCtrl = new ProviderController(mainCtrl, dappsCtrl)
    const [requestType, condition] =
      Reflect.getMetadata('NOTIFICATION_REQUEST', providerCtrl, mapMethod) || []
    console.log('1')
    if (requestType && (!condition || !condition(props))) {
      console.log('2')
      // eslint-disable-next-line no-param-reassign
      props.requestRes = await notificationCtrl.requestNotificationRequest({
        ...request,
        screen: requestType
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

export default (request: ProviderRequest, controllers: ProviderNeededControllers) => {
  return flowContext({ request, controllers, mapMethod: underline2Camelcase(request.method) })
}
