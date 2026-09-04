import '@common/modules/inpage/globals'

import { isProd } from '@common/config/env'
import {
  AMBIRE_PROVIDER_INFO,
  announceEip6963Provider,
  METAMASK_DISGUISE_PROVIDER_INFO
} from '@common/modules/inpage/eip6963'
import {
  isCrossOriginFrame,
  isTooDeepFrameInTheFrameHierarchy
} from '@web/extension-services/utils/frames'
import { EthereumProvider } from '@web/modules/inpage/EthereumProvider'

let forwardRpcRequestId = 0
const foundDappRpcUrls: string[] = []
let isDapp = false
let isDisguisedAsMetaMask = false

;(function () {
  if (isCrossOriginFrame() || isTooDeepFrameInTheFrameHierarchy()) return

  const originalFetch = window.fetch.bind(window)

  window.fetch = function (...args) {
    // fire-and-forget, do not affect the original fetch promise
    ;(async () => {
      const [resource, config] = args
      let fetchURL: string = ''
      let fetchBody: any

      if (typeof resource === 'string' && config && config?.body) {
        fetchURL = resource
        fetchBody = config.body
      }

      if (typeof resource === 'object') {
        // Avoid reading the body from the original fetch request, as the Request object has a 'bodyUsed' property that prevents multiple reads of the body.
        // To work around this, clone the original Request, read the body from the clone, and leave the original request intact for the webpage to read
        let reqClone: Request | undefined

        try {
          reqClone = (resource as Request).clone()
        } catch (error) {
          if (isProd) {
            // intentionally swallow internal ambire-inpage errors to avoid polluting the page console
          } else {
            console.error('RPC forwarding logic:', error)
          }
        }

        if (reqClone) {
          if ((resource as Request)?.body) {
            if (reqClone.body) {
              fetchURL = reqClone.url
              fetchBody = await new Response(reqClone.body).text()
            }
          } else {
            try {
              // In Firefox, reqClone.body is not present in the object.
              // It needs to be retrieved asynchronously via the .json() func
              const body = await reqClone.json()
              fetchURL = reqClone.url
              fetchBody = body
            } catch (error) {
              if (isProd) {
                // intentionally swallow internal ambire-inpage errors to avoid polluting the page console
              } else {
                console.error('RPC forwarding logic:', error)
              }
            }
          }
        }
      }

      if (!!fetchURL && !!fetchBody) {
        // if the dapp uses ethers the body of the requests to the RPC will be Uint8Array
        if (fetchBody instanceof Uint8Array) {
          try {
            const bodyObject = JSON.parse(new TextDecoder('utf-8').decode(fetchBody))
            if (bodyObject.jsonrpc) {
              if (!foundDappRpcUrls.includes(fetchURL)) foundDappRpcUrls.push(fetchURL) // store potential RPC URL
            }
          } catch (error) {
            if (isProd) {
              // intentionally swallow internal ambire-inpage errors to avoid polluting the page console
            } else {
              console.error('RPC forwarding logic:', error)
            }
          }
        } else {
          try {
            const fetchBodyObject: any = JSON.parse(fetchBody as any)
            if (fetchBodyObject.jsonrpc) {
              if (!foundDappRpcUrls.includes(fetchURL)) foundDappRpcUrls.push(fetchURL) // store the potential RPC URL
            }
          } catch (error) {
            if (fetchBody?.jsonrpc) {
              if (!foundDappRpcUrls.includes(fetchURL)) foundDappRpcUrls.push(fetchURL) // store the potential RPC URL
            }
          }
        }
      }
    })().catch((err) => {
      if (isProd) {
        // intentionally swallow internal ambire-inpage errors to avoid polluting the page console
      } else {
        console.error('RPC forwarding logic:', err)
      }
    })

    return originalFetch(...args)
  }
})()

export async function forwardRpcRequests(url: string, method: any, params: any) {
  forwardRpcRequestId++
  const id = forwardRpcRequestId
  const data = JSON.stringify({ jsonrpc: '2.0', method, params, id })

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: data
  })

  if (!response.ok) throw new Error(`RPC call failed with status ${response.status}`)

  const responseJson = await response.json()
  return responseJson.result
}

const provider = new EthereumProvider(forwardRpcRequests, () => foundDappRpcUrls, {
  deferInitialization: isCrossOriginFrame() || isTooDeepFrameInTheFrameHierarchy()
})
const ambireProvider = new Proxy(provider, {
  deleteProperty: (target, prop) => {
    if (typeof prop === 'string' && ['on', 'isAmbire', 'isMetaMask'].includes(prop)) {
      // @ts-ignore
      delete target[prop]
    }
    return true
  }
})

export { ambireProvider }

if (globalIsAmbireNext) {
  window.ambireNext = ambireProvider
} else {
  window.ambire = ambireProvider
}

provider.setOnDisguiseAsMetaMask(() => {
  isDisguisedAsMetaMask = true
  announceEip6963Provider(ambireProvider, METAMASK_DISGUISE_PROVIDER_INFO)
})

window.addEventListener<any>('eip6963:requestProvider', () => {
  announceEip6963Provider(ambireProvider, AMBIRE_PROVIDER_INFO)
  if (isDisguisedAsMetaMask)
    announceEip6963Provider(ambireProvider, METAMASK_DISGUISE_PROVIDER_INFO)

  if (!isDapp) {
    try {
      // throw an Error to determine the source of the request
      throw new Error()
    } catch (error: any) {
      const stack = error?.stack // Parse the stack trace to get the caller info
      if (stack) {
        const callerPage = (typeof stack === 'string' && stack.split('\n')[2]?.trim()) || ''
        if (callerPage.includes(window.location.hostname)) {
          isDapp = true
          // Send a request to the provider to notify the background session that this page is a dApp
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          ambireProvider.request({ method: 'eth_chainId', params: [] })
        }
      }
    }
  }
})

announceEip6963Provider(ambireProvider, AMBIRE_PROVIDER_INFO)

window.dispatchEvent(new Event('ethereum#initialized'))
