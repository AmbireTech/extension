/* eslint-disable @typescript-eslint/no-floating-promises */
import 'reflect-metadata'

import { ethErrors } from 'eth-rpc-errors'

import { MainController } from '@ambire-common/controllers/main/main'
import { Dapp, DappProviderRequest } from '@ambire-common/interfaces/dapp'
import { ProviderController } from '@web/extension-services/background/provider/ProviderController'
import { RequestRes } from '@web/extension-services/background/provider/types'
import PromiseFlow from '@web/utils/promiseFlow'
import underline2Camelcase from '@web/utils/underline2Camelcase'

const lockedOrigins: { [key: string]: Promise<any> } = {}
const connectOrigins: { [key: string]: Promise<any> } = {}

const flow = new PromiseFlow<{
  request: DappProviderRequest
  mainCtrl: MainController
  mapMethod: string
  requestRes?: RequestRes
}>()

const flowContext = flow
  // validate the provided method
  .use(async ({ request, mainCtrl, mapMethod }, next) => {
    const { method, params } = request
    const providerCtrl = new ProviderController(mainCtrl)
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
  .use(async ({ request, mainCtrl, mapMethod }, next) => {
    const {
      session: { origin }
    } = request

    const providerCtrl = new ProviderController(mainCtrl)

    if (!Reflect.getMetadata('SAFE', providerCtrl, mapMethod)) {
      const isUnlocked = mainCtrl.keystore.isReadyToStoreKeys ? mainCtrl.keystore.isUnlocked : true

      if (!isUnlocked && mainCtrl.dapps.hasPermission(origin)) {
        try {
          if (lockedOrigins[origin] === undefined) {
            lockedOrigins[origin] = await new Promise((resolve: (value: any) => void, reject) => {
              mainCtrl.buildUserRequestFromDAppRequest(
                { ...request, method: 'unlock', params: {} },
                { resolve, reject, session: request.session }
              )
            })
          }
          await lockedOrigins[origin]
          delete lockedOrigins[origin]
        } catch (e) {
          delete lockedOrigins[origin]
          throw e
        }
      }
    }

    return next()
  })
  // if dApp not connected - prompt connect action window
  .use(async ({ request, mainCtrl, mapMethod }, next) => {
    const {
      session: { origin, name, icon }
    } = request
    const providerCtrl = new ProviderController(mainCtrl)
    if (!Reflect.getMetadata('SAFE', providerCtrl, mapMethod)) {
      if (!mainCtrl.dapps.hasPermission(origin)) {
        try {
          if (connectOrigins[origin] === undefined) {
            connectOrigins[origin] = new Promise((resolve: (value: any) => void, reject) => {
              mainCtrl.buildUserRequestFromDAppRequest(
                { ...request, method: 'dapp_connect', params: {} },
                { resolve, reject, session: request.session }
              )
            })
          }
          await connectOrigins[origin]
          delete connectOrigins[origin]

          const isBlacklisted = await mainCtrl.phishing.getIsBlacklisted(origin)
          mainCtrl.dapps.addDapp({
            name,
            url: origin,
            icon,
            description: 'Custom app automatically added when connected for the first time.',
            favorite: false,
            chainId: 1,
            isConnected: true,
            blacklisted: isBlacklisted
          } as Dapp)
          await mainCtrl.dapps.broadcastDappSessionEvent(
            'chainChanged',
            { chain: '0x1', networkVersion: '1' },
            origin
          )
        } catch (e) {
          delete connectOrigins[origin]
          throw e
        }
      }
    }

    return next()
  })
  // add the dapp request as a userRequest and action
  .use(async (props, next) => {
    const { request, mainCtrl, mapMethod } = props
    const providerCtrl = new ProviderController(mainCtrl)

    const [requestType, condition] =
      Reflect.getMetadata('ACTION_REQUEST', providerCtrl, mapMethod) || []
    if (requestType && (!condition || !condition(props))) {
      // eslint-disable-next-line no-param-reassign
      props.requestRes = await new Promise((resolve, reject) => {
        mainCtrl
          .buildUserRequestFromDAppRequest(request, {
            resolve,
            reject,
            session: request.session
          })
          .catch((error) => reject(error))
      })
    }

    return next()
  })
  .use(async ({ request, mainCtrl, mapMethod, requestRes }) => {
    const providerCtrl = new ProviderController(mainCtrl)

    return Promise.resolve((providerCtrl as any)[mapMethod]({ ...request, requestRes }))
  })
  .callback()

export default (request: DappProviderRequest, mainCtrl: MainController) => {
  return flowContext({ request, mainCtrl, mapMethod: underline2Camelcase(request.method) })
}
