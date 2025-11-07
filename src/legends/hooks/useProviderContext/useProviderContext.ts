import { useContext } from 'react'

import { ProviderContext } from '@legends/contexts/providerContext'

export default function useProviderContext() {
  const context = useContext(ProviderContext)

  if (!context) {
    throw new Error('useProviderContext must be used within a ProviderContext')
  }

  return context
}
