import { useContext } from 'react'

import { Web3Context } from '@mobile/modules/web3/contexts/web3Context'

export default function useWeb3() {
  const context = useContext(Web3Context)

  if (!context) {
    throw new Error('useWeb3 must be used within an Web3Provider')
  }

  return context
}
