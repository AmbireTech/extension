declare const globalIsAmbireNext: boolean

if (/Opera|OPR\//i.test(navigator.userAgent)) {
  window.ethereum = new Proxy(globalIsAmbireNext ? window.ambireNext : window.ambire, {
    get: (t, p, r) => Reflect.get(t, p, r)
  })
} else {
  const d = Object.getOwnPropertyDescriptor(window, 'ethereum')
  let isDapp = false

  // Create a proxied provider that detects actual usage of the provider
  const createMonitoredProvider = () => {
    const provider = globalIsAmbireNext ? window.ambireNext : window.ambire

    return new Proxy(provider, {
      get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver)

        isDapp = true

        // Notify background that this is a real dApp
        if (provider) {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          provider
            .request({
              method: 'eth_chainId',
              params: []
            })
            .catch((e) => console.error('Error notifying background of window.ethereum usage', e))
        }

        return value
      }
    })
  }

  if (!d || d.configurable) {
    Object.defineProperty(window, 'ethereum', {
      configurable: false,
      enumerable: true,
      get: () => {
        if (!isDapp) {
          try {
            // throw an Error to determine the source of the request
            throw new Error()
          } catch (error: any) {
            const stack = error?.stack // Parse the stack trace to get the caller info
            if (stack) {
              const callerPage = (typeof stack === 'string' && stack.split('\n')[2]?.trim()) || ''
              if (callerPage.includes(window.location.hostname)) {
                // Yes, the app is using window.ethereum, but we need to make sure
                // that it's actually calling methods on it. This is because some websites
                // (like amazon) just check for its presence for tracking purposes.
                return createMonitoredProvider()
              }
            }
          }
        }

        return globalIsAmbireNext ? window.ambireNext : window.ambire
      },
      set: () => {}
    })
  }
  window.web3 ||= { currentProvider: globalIsAmbireNext ? window.ambireNext : window.ambire }
}
window.dispatchEvent(new Event('ethereum#initialized'))
