import { useContext } from 'react'

import { WalletConnectContext } from '../components/WalletConnectProvider'

export const useWalletConnect = () => {
  const context = useContext(WalletConnectContext)
  if (!context) {
    throw new Error('useWalletConnect must be used within WalletConnectProvider')
  }
  return context
}
