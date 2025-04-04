import { useContext } from 'react'

import { DomainsContext } from '@common/contexts/domainsContext'

export default function useDomainsContext() {
  const context = useContext(DomainsContext)

  if (!context) {
    throw new Error('useDomainsContext must be used within a DomainsContext')
  }

  return context
}
