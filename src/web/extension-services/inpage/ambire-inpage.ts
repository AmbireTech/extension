/* eslint-disable no-param-reassign */
import { nanoid } from 'nanoid'

import { isProd } from '@common/config/env'
import { EthereumProvider } from '@web/extension-services/inpage/EthereumProvider'
import {
  isCrossOriginFrame,
  isTooDeepFrameInTheFrameHierarchy
} from '@web/extension-services/utils/frames'

declare const globalIsAmbireNext: boolean

const ambireId = nanoid()

interface EIP6963ProviderInfo {
  uuid: string
  name: string
  icon: string
  rdns: string
}
interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo
  provider: EthereumProvider
}

interface EIP6963AnnounceProviderEvent extends CustomEvent {
  type: 'eip6963:announceProvider'
  detail: EIP6963ProviderDetail
}

interface EIP6963RequestProviderEvent extends Event {
  type: 'eip6963:requestProvider'
}

declare global {
  interface Window {
    ethereum: EthereumProvider
    web3: any
    ambire: EthereumProvider
    ambireNext: EthereumProvider
  }
}

let forwardRpcRequestId = 0
const foundDappRpcUrls: string[] = []
let isDapp = false

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

const provider = new EthereumProvider(forwardRpcRequests, () => foundDappRpcUrls)
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

const announceEip6963Provider = (p: EthereumProvider) => {
  const info: EIP6963ProviderInfo = {
    uuid: ambireId,
    name: globalIsAmbireNext ? 'Ambire Next' : 'Ambire',
    icon: globalIsAmbireNext
      ? "data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cg clip-path='url(%23clip0_8421_23)'%3E%3Crect width='40' height='40' rx='11' fill='%23E1FF00'/%3E%3Cpath d='M16.3695 7.71244L14.1986 13.8733C14.1864 13.9079 14.1814 13.9444 14.1839 13.9809C14.1863 14.0175 14.1961 14.0531 14.2128 14.0857L16.2411 18.0691L10.6686 21.2266C10.6525 21.2359 10.6347 21.2418 10.6162 21.2439C10.5978 21.246 10.5791 21.2441 10.5613 21.2386C10.5436 21.2332 10.5271 21.2241 10.513 21.212C10.499 21.1999 10.4875 21.185 10.4795 21.1682L9.27444 18.6583C9.25411 18.6164 9.24508 18.5699 9.24814 18.5234C9.25121 18.4769 9.26628 18.4322 9.29194 18.3934L16.3228 7.68741C16.3269 7.68309 16.3324 7.68021 16.3383 7.67927C16.3443 7.67834 16.3503 7.67949 16.3556 7.68232C16.3609 7.68516 16.3651 7.68949 16.3676 7.69494C16.3701 7.70038 16.3708 7.70658 16.3695 7.71244Z' fill='%231E2433'/%3E%3Cpath d='M27.2814 15.9644L31.8977 25.7975C31.9214 25.849 31.9289 25.9066 31.9185 25.9623C31.908 26.018 31.8803 26.069 31.8395 26.1084L19.7037 37.8284C19.6846 37.8469 19.6607 37.8597 19.6345 37.8646C19.6084 37.8695 19.5813 37.8665 19.5568 37.856C19.5323 37.8456 19.5112 37.8282 19.4966 37.806C19.482 37.7838 19.4745 37.7577 19.4746 37.7311V26.9543L27.1264 19.5687C27.1529 19.5443 27.1739 19.5146 27.1882 19.4816C27.2026 19.4486 27.2096 19.413 27.2094 19.377L27.2314 15.9753C27.2318 15.9696 27.2341 15.9642 27.2379 15.9599C27.2417 15.9555 27.2465 15.9521 27.2521 15.9509C27.2577 15.9497 27.2636 15.9506 27.2688 15.953C27.274 15.9554 27.2787 15.9593 27.2814 15.9644Z' fill='%231E2433'/%3E%3Cpath d='M16.2397 18.0701L9.61719 19.3767L10.478 21.1667C10.4862 21.1833 10.4977 21.1982 10.5118 21.2102C10.5259 21.2223 10.5423 21.2312 10.56 21.2367C10.5777 21.2421 10.5964 21.244 10.6148 21.2419C10.6332 21.2399 10.6511 21.234 10.6672 21.2249L16.2405 18.0693L16.2397 18.0701Z' fill='black'/%3E%3Cpath d='M14.1826 13.945L9.25928 18.4567C9.26677 18.4341 9.27713 18.4126 9.2901 18.3926L16.3209 7.68663C16.3233 7.68282 16.3267 7.67986 16.3306 7.67768C16.3345 7.67549 16.339 7.67424 16.3435 7.67422C16.3479 7.67403 16.3523 7.67489 16.3563 7.67686C16.3603 7.67884 16.3638 7.68176 16.3664 7.68541C16.3689 7.68906 16.3706 7.69339 16.3711 7.69782C16.3716 7.70225 16.371 7.7067 16.3693 7.71084L14.1976 13.8717C14.1893 13.8954 14.1842 13.92 14.1826 13.945Z' fill='%23343B4E'/%3E%3Cpath d='M23.8985 22.685L19.4727 33.0366V26.9534L23.8985 22.685Z' fill='black'/%3E%3Cpath d='M31.9173 25.9661L27.168 19.5176C27.1932 19.4764 27.2066 19.4291 27.207 19.3809L27.2257 15.9759C27.226 15.9723 27.2274 15.969 27.229 15.9657C27.2306 15.9625 27.2328 15.9596 27.2355 15.9572C27.2382 15.9548 27.241 15.9527 27.2445 15.9515C27.2479 15.9503 27.2514 15.95 27.255 15.9503C27.2603 15.9503 27.2654 15.9518 27.2697 15.9547C27.274 15.9577 27.2776 15.962 27.2795 15.967L31.8937 25.8001C31.9213 25.8507 31.9293 25.9097 31.9173 25.9661Z' fill='%23343B4E'/%3E%3Cpath d='M19.5753 2.72751L24.7003 15.2817C24.7141 15.3147 24.7213 15.3501 24.7213 15.3858C24.7213 15.4216 24.7141 15.457 24.7003 15.49L16.4219 34.8575C16.4133 34.8777 16.3998 34.8955 16.3828 34.9094C16.3657 34.9233 16.3455 34.9328 16.324 34.9371C16.3024 34.9415 16.2801 34.9405 16.259 34.9343C16.2379 34.9281 16.2186 34.9169 16.2028 34.9017L8.58778 27.5467C8.54047 27.5011 8.51136 27.4399 8.50584 27.3744C8.50032 27.3089 8.51879 27.2437 8.5578 27.1908L19.4186 12.4775C19.4527 12.4308 19.4711 12.3745 19.4711 12.3167V2.74419C19.472 2.732 19.4769 2.72045 19.4852 2.71144C19.4935 2.70242 19.5045 2.69646 19.5166 2.69453C19.5287 2.69259 19.541 2.69482 19.5517 2.70081C19.5623 2.7068 19.5707 2.7162 19.5753 2.72751Z' fill='url(%23paint0_linear_8421_23)'/%3E%3Cpath d='M19.4585 12.3942L24.7193 15.3692C24.7186 15.3383 24.7121 15.3078 24.7002 15.2792L19.5745 2.72507C19.5709 2.71477 19.5639 2.70587 19.5549 2.69972C19.5459 2.69357 19.5353 2.69047 19.5244 2.69089C19.5173 2.69089 19.5102 2.69231 19.5037 2.69504C19.4971 2.69777 19.4911 2.70177 19.4862 2.70681C19.4812 2.71186 19.4774 2.71782 19.4748 2.72439C19.4721 2.73096 19.471 2.73799 19.4711 2.74506V12.3134C19.4707 12.3408 19.4664 12.368 19.4585 12.3942Z' fill='%23343B4E'/%3E%3C/g%3E%3Cdefs%3E%3ClinearGradient id='paint0_linear_8421_23' x1='19.5645' y1='7.27277' x2='8.60539' y2='30.8846' gradientUnits='userSpaceOnUse'%3E%3Cstop/%3E%3Cstop offset='0.386' stop-color='%231E2433'/%3E%3Cstop offset='1' stop-color='%23343B4E'/%3E%3C/linearGradient%3E%3CclipPath id='clip0_8421_23'%3E%3Crect width='40' height='40' fill='white'/%3E%3C/clipPath%3E%3C/defs%3E%3C/svg%3E%0A"
      : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' width='40' height='40' viewBox='0 0 40 40'%3E%3Cdefs%3E%3ClinearGradient id='linear-gradient' x1='0.554' y1='0.58' x2='0.052' y2='0.409' gradientUnits='objectBoundingBox'%3E%3Cstop offset='0' stop-color='%236000ff'/%3E%3Cstop offset='0.651' stop-color='%234900c3'/%3E%3Cstop offset='1' stop-color='%23320086'/%3E%3C/linearGradient%3E%3ClinearGradient id='linear-gradient-2' x1='0.06' y1='-0.087' x2='0.486' y2='0.653' gradientUnits='objectBoundingBox'%3E%3Cstop offset='0' stop-color='%236a0aff'/%3E%3Cstop offset='0.047' stop-color='%238c2dff'/%3E%3Cstop offset='0.102' stop-color='%236a0aff'/%3E%3Cstop offset='0.902' stop-color='%23af50ff'/%3E%3Cstop offset='1' stop-color='%23af50ff'/%3E%3C/linearGradient%3E%3ClinearGradient id='linear-gradient-3' x1='1.071' y1='0.062' x2='0.095' y2='1.049' gradientUnits='objectBoundingBox'%3E%3Cstop offset='0' stop-color='%236a0aff'/%3E%3Cstop offset='0.51' stop-color='%238c2dff'/%3E%3Cstop offset='0.969' stop-color='%23af50ff'/%3E%3Cstop offset='1' stop-color='%23af50ff'/%3E%3C/linearGradient%3E%3ClinearGradient id='linear-gradient-4' x1='0.448' y1='0.297' x2='0.538' y2='0.8' gradientUnits='objectBoundingBox'%3E%3Cstop offset='0' stop-color='%236000ff'/%3E%3Cstop offset='1' stop-color='%233e00a5'/%3E%3C/linearGradient%3E%3ClinearGradient id='linear-gradient-5' x1='-0.529' y1='1.069' x2='1.092' y2='0.86' gradientUnits='objectBoundingBox'%3E%3Cstop offset='0' stop-color='%23ae60ff'/%3E%3Cstop offset='0.322' stop-color='%23af50ff'/%3E%3Cstop offset='1' stop-color='%236000ff'/%3E%3C/linearGradient%3E%3ClinearGradient id='linear-gradient-6' x1='-0.111' y1='0.274' x2='0.872' y2='1.224' gradientUnits='objectBoundingBox'%3E%3Cstop offset='0' stop-color='%236f0fff'/%3E%3Cstop offset='0.702' stop-color='%23af50ff'/%3E%3Cstop offset='1' stop-color='%23af50ff'/%3E%3C/linearGradient%3E%3ClinearGradient id='linear-gradient-7' x1='0.015' y1='0.007' x2='0.985' y2='0.95' gradientUnits='objectBoundingBox'%3E%3Cstop offset='0' stop-color='%23ae60ff'/%3E%3Cstop offset='0.031' stop-color='%23b670fa'/%3E%3Cstop offset='1' stop-color='%23be80f5'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cg id='ambire_symbol_40x40' data-name='ambire symbol 40x40' transform='translate(20193 20411)'%3E%3Cg id='Ambire_Wallet' data-name='Ambire Wallet' transform='translate(-20184.996 -20408.99)'%3E%3Cg id='_1967776972864' transform='translate(0.013 -0.01)'%3E%3Cg id='Group_190' data-name='Group 190'%3E%3Cpath id='Path_636' data-name='Path 636' d='M526.324,626.595l4.724,10.056a.284.284,0,0,1-.058.314l-12.427,12.007a.138.138,0,0,1-.233-.1V637.836l7.831-7.56a.254.254,0,0,0,.081-.2l.023-3.484c0-.023.047-.023.058,0Z' transform='translate(-507.107 -613.01)' fill='%236000ff'/%3E%3Cpath id='Path_637' data-name='Path 637' d='M518.34,803.227v11.032a.138.138,0,0,0,.233.1h0L531,802.356a.284.284,0,0,0,.058-.313h0l-4.852-6.413Z' transform='translate(-507.116 -778.401)' fill-rule='evenodd' fill='url(%23linear-gradient)'/%3E%3Cpath id='Path_638' data-name='Path 638' d='M881.705,626.01h0a.027.027,0,0,0-.028.028h0l-.02,3.483a.286.286,0,0,1-.046.162l4.871,6.574a.3.3,0,0,0-.023-.174h0l-4.724-10.056a.032.032,0,0,0-.028-.016h0Z' transform='translate(-862.52 -612.454)' fill-rule='evenodd' fill='url(%23linear-gradient-2)'/%3E%3Cpath id='Path_639' data-name='Path 639' d='M895.766,814.726a.3.3,0,0,0-.023-.174h0l-.245-.522-4.4-5.6,4.665,6.3Z' transform='translate(-871.805 -790.924)' fill='%23be80f5' fill-rule='evenodd'/%3E%3Cpath id='Path_640' data-name='Path 640' d='M41.775,235.523l-2.222,6.294a.292.292,0,0,0,.012.221l2.071,4.076-5.7,3.228a.149.149,0,0,1-.2-.058L34.5,246.718a.247.247,0,0,1,.023-.267l7.191-10.962a.035.035,0,0,1,.058.035Z' transform='translate(-33.728 -230.38)' fill='%236000ff'/%3E%3Cpath id='Path_641' data-name='Path 641' d='M57.616,235.46h0a.031.031,0,0,0-.022.009h0l-6.884,10.493-.008.014,4.727-4.179.015-.042h0v0L57.65,235.5a.034.034,0,0,0-.034-.044Z' transform='translate(-49.602 -230.361)' fill-rule='evenodd' fill='url(%23linear-gradient-3)'/%3E%3Cpath id='Path_642' data-name='Path 642' d='M34.516,532.813a.247.247,0,0,0-.023.267h0l1.233,2.566a.149.149,0,0,0,.2.058h0l5.7-3.228L39.554,528.4a.29.29,0,0,1-.012-.221Z' transform='translate(-33.718 -516.743)' fill-rule='evenodd' fill='url(%23linear-gradient-4)'/%3E%3Cpath id='Path_643' data-name='Path 643' d='M11.237.047V9.836a.279.279,0,0,1-.058.163h0L.067,25.06a.269.269,0,0,0,.035.36h0l7.8,7.525a.134.134,0,0,0,.221-.047h0L16.59,13.076a.32.32,0,0,0,0-.209h0L11.342.024a.05.05,0,0,0-.047-.034h0a.057.057,0,0,0-.057.057Z' transform='translate(-0.013 0.01)' fill-rule='evenodd' fill='url(%23linear-gradient-5)'/%3E%3Cpath id='Path_644' data-name='Path 644' d='M517.729,0h0a.057.057,0,0,0-.057.057l0,9.789a.276.276,0,0,1-.014.081l5.3,2.789L517.776.034A.05.05,0,0,0,517.729,0Zm-.069,9.927,1.012.581Z' transform='translate(-506.451 0)' fill-rule='evenodd' fill='url(%23linear-gradient-6)'/%3E%3Cpath id='Path_645' data-name='Path 645' d='M523.055,461.518v0a.319.319,0,0,0-.016-.1h0l-.067-.166-5.3-2.789,1.015.581Z' transform='translate(-506.461 -448.532)' fill-rule='evenodd' fill='url(%23linear-gradient-7)'/%3E%3Cpath id='Path_646' data-name='Path 646' d='M37.323,532.352l-.293.446,5.023-4.628Z' transform='translate(-36.228 -516.733)' fill='%23be80f5'/%3E%3C/g%3E%3C/g%3E%3C/g%3E%3Crect id='Rectangle_1110' data-name='Rectangle 1110' width='40' height='40' transform='translate(-20193 -20411)' fill='none'/%3E%3C/g%3E%3C/svg%3E",
    rdns: globalIsAmbireNext ? 'com.ambire-next.wallet' : 'com.ambire.wallet'
  }

  window.dispatchEvent(
    new CustomEvent('eip6963:announceProvider', {
      detail: Object.freeze({ info, provider: p })
    })
  )
}

window.addEventListener<any>('eip6963:requestProvider', () => {
  announceEip6963Provider(ambireProvider)

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

announceEip6963Provider(ambireProvider)

window.dispatchEvent(new Event('ethereum#initialized'))
