import { useCallback, useEffect, useRef } from 'react'

import { NameServiceId } from '@ambire-common/services/nameResolvers'
import useController from '@common/hooks/useController'

interface Props {
  domain: string
  bip44Item?: number[][]
}

// Define the type for our pending promises tracker
type Resolver = {
  resolve: (result: { address: string | undefined; type: NameServiceId } | undefined) => void
  reject: (reason?: any) => void
}

const useResolveDomain = () => {
  const {
    state: { domainToAddresses, resolveDomainsErrors, resolveDomainsStatus },
    dispatch
  } = useController('DomainsController')

  const requests = useRef<Record<string, Resolver>>({})

  useEffect(() => {
    Object.keys(requests.current).forEach((domain) => {
      const status = resolveDomainsStatus[domain]
      const resolver = requests.current[domain]

      if (!resolver) return

      if (status === 'RESOLVED') {
        resolver.resolve(domainToAddresses[domain])
        delete requests.current[domain]
      } else if (status === 'FAILED') {
        resolver.reject(
          new Error(resolveDomainsErrors[domain] || `Failed to resolve domain: ${domain}`)
        )
        delete requests.current[domain]
      }
    })
  }, [domainToAddresses, resolveDomainsErrors, resolveDomainsStatus])

  const handleResolveDomain = useCallback(
    ({
      domain,
      bip44Item
    }: Props): Promise<{ address: string | undefined; type: NameServiceId } | undefined> => {
      const status = resolveDomainsStatus[domain]

      if (status === 'RESOLVED') return Promise.resolve(domainToAddresses[domain])

      if (status === 'FAILED')
        return Promise.reject(
          new Error(resolveDomainsErrors[domain] || `Failed to resolve domain: ${domain}`)
        )

      if (!status)
        dispatch({
          type: 'method',
          params: { method: 'resolveDomain', args: [{ domain }] }
        })

      return new Promise((resolve, reject) => {
        requests.current[domain] = { resolve, reject }
      })
    },
    [dispatch, domainToAddresses, resolveDomainsErrors, resolveDomainsStatus]
  )

  return {
    resolveDomain: handleResolveDomain
  }
}

export default useResolveDomain
