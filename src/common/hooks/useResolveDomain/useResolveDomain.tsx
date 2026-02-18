import { useCallback, useEffect, useRef } from 'react'

import useController from '@common/hooks/useController'

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
    dispatch
  } = useController('DomainsController')

  const requests = useRef<Record<string, Resolver>>({})

  useEffect(() => {
    Object.keys(requests.current).forEach((domain) => {
      const status = resolveDomainsStatus[domain]
      const resolver = requests.current[domain]

      if (!resolver) return

      if (status === 'RESOLVED') {
        resolver.resolve(ensToAddress[domain])
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

      if (status === 'RESOLVED') return Promise.resolve(ensToAddress[domain])

      if (status === 'FAILED')
        return Promise.reject(new Error(`Failed to resolve domain: ${domain}`))

      if (!status)
        dispatch({
          type: 'method',
          params: { method: 'resolveDomain', args: [{ domain, bip44Item }] }
        })

      return new Promise((resolve, reject) => {
        requests.current[domain] = { resolve, reject }
      })
    },
    [dispatch, ensToAddress, resolveDomainsStatus]
  )

  return {
    resolveDomain: handleResolveDomain as ({
      domain,
      bip44Item
    }: Props) => Promise<string | undefined>
  }
}

export default useResolveDomain
