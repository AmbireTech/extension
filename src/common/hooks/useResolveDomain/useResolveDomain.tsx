import { useCallback, useEffect, useRef } from 'react'

import useDomainsControllerState from '@web/hooks/useDomainsController/useDomainsController'

interface Props {
  domain: string
  bip44Item?: number[][]
}

// Define the type for our pending promises tracker
type Resolver = {
  resolve: (ensAddress: string | undefined) => void
  reject: (reason?: any) => void
}

const useResolveDomain = () => {
  const {
    state: { ensToAddress, resolveDomainsStatus },
    resolveDomain
  } = useDomainsControllerState()

  const requests = useRef<Record<string, Resolver>>({})

  useEffect(() => {
    Object.keys(requests.current).forEach((domain) => {
      const status = resolveDomainsStatus[domain]
      const resolver = requests.current[domain]

      if (!resolver) return

      if (status === 'RESOLVED') {
        resolver.resolve(ensToAddress[domain] ? domain : undefined)
        delete requests.current[domain]
      } else if (status === 'FAILED') {
        resolver.reject(new Error(`Failed to resolve domain: ${domain}`))
        delete requests.current[domain]
      }
    })
  }, [ensToAddress, resolveDomainsStatus])

  const handleResolveDomain = useCallback(
    ({ domain, bip44Item }: Props) => {
      const status = resolveDomainsStatus[domain]

      if (status === 'RESOLVED') return Promise.resolve(ensToAddress[domain] ? domain : undefined)

      if (status === 'FAILED')
        return Promise.reject(new Error(`Failed to resolve domain: ${domain}`))

      if (!status) resolveDomain({ domain, bip44Item })

      return new Promise((resolve, reject) => {
        requests.current[domain] = { resolve, reject }
      })
    },
    [resolveDomain, ensToAddress, resolveDomainsStatus]
  )

  return {
    resolveDomain: handleResolveDomain as ({
      domain,
      bip44Item
    }: Props) => Promise<string | undefined>
  }
}

export default useResolveDomain
