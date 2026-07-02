import '@common/modules/inpage/globals'

// `window.ethereum` and the EIP-6963 provider are the same object, so a dapp using both (e.g.
// wagmi's generic `injected()` connector alongside EIP-6963, as Reown AppKit does) can silently
// confirm "already connected" via `window.ethereum` and treat that as a second wallet identity -
// causing AppKit to disconnect the real EIP-6963 session. Fix: once a page proves it's EIP-6963-
// aware, `window.ethereum` stops silently confirming connection status until it's explicitly
// asked to connect. Legacy-only dapps (no EIP-6963) are unaffected.
const SILENT_CONNECTION_CHECK_METHODS = ['eth_accounts', 'eth_coinbase']

let isEip6963AwarePage = false
let legacyRequestAccountsGranted = false
window.addEventListener('eip6963:requestProvider', () => {
  // Dispatched on `window`, so another installed wallet's script asking others to announce
  // could trigger this too. Same caller-stack check as `isDapp` below: trust it only if it
  // actually comes from the page.
  try {
    throw new Error()
  } catch (error: any) {
    const stack = error?.stack
    const callerPage = (typeof stack === 'string' && stack.split('\n')[2]?.trim()) || ''
    if (callerPage.includes(window.location.hostname)) {
      isEip6963AwarePage = true
    }
  }
})

const gateLegacyProvider =
  (request: (...args: any[]) => any) =>
  async (...args: any[]) => {
    const [data] = args
    if (
      isEip6963AwarePage &&
      !legacyRequestAccountsGranted &&
      SILENT_CONNECTION_CHECK_METHODS.includes(data?.method)
    ) {
      return data.method === 'eth_accounts' ? [] : null
    }

    const result = await request(...args)
    if (data?.method === 'eth_requestAccounts') legacyRequestAccountsGranted = true
    return result
  }

if (/Opera|OPR\//i.test(navigator.userAgent)) {
  const target = globalIsAmbireNext ? window.ambireNext : window.ambire
  window.ethereum = new Proxy(target, {
    get: (t, p, r) =>
      p === 'request' ? gateLegacyProvider(Reflect.get(t, p, r)) : Reflect.get(t, p, r)
  })
} else {
  const d = Object.getOwnPropertyDescriptor(window, 'ethereum')
  let isDapp = false

  // Get a proxied provider that detects actual usage of the provider
  const getMonitoredProvider = () => {
    const provider = globalIsAmbireNext ? window.ambireNext : window.ambire

    return new Proxy(provider, {
      get(target, prop, receiver) {
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

                // Notify background that this is a real dApp
                if (provider) {
                  provider
                    .request({ method: 'eth_chainId', params: [] })
                    .catch((e) =>
                      console.error('Error notifying background of window.ethereum usage', e)
                    )
                }
              }
            }
          }
        }

        if (prop === 'request') {
          return gateLegacyProvider(Reflect.get(target, prop, receiver))
        }

        return Reflect.get(target, prop, receiver)
      }
    })
  }

  if (!d || d.configurable) {
    Object.defineProperty(window, 'ethereum', {
      configurable: false,
      enumerable: true,
      get: getMonitoredProvider,
      set: () => {}
    })
  }
  window.web3 ||= { currentProvider: globalIsAmbireNext ? window.ambireNext : window.ambire }
}
window.dispatchEvent(new Event('ethereum#initialized'))
