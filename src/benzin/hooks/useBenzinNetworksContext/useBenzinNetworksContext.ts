import { useContext } from 'react'

import { benzinNetworksContext } from '@benzin/context'

export default function useBenzinNetworksContext() {
  const context = useContext(benzinNetworksContext)

  if (!context) {
    throw new Error('useBenzinNetworksContext must be used within a BenzinNetworksContextProvider')
  }

  return context
}
