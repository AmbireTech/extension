import { useContext } from 'react'

import { DappsContext } from '@mobile/modules/web3/contexts/dappsContext'

export default function useDapps() {
  const context = useContext(DappsContext)

  if (!context) {
    throw new Error('useDapps must be used within a DappsProvider')
  }

  return context
}
