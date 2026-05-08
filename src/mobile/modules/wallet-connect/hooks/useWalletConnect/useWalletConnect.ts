import { useContext } from 'react'

import { WalletConnectContext } from '@mobile/modules/wallet-connect/contexts/walletConnectContext'

const useWalletConnect = () => {
  const context = useContext(WalletConnectContext)
  if (!context) {
    throw new Error('useWalletConnect must be used within WalletConnectProvider')
  }
  return context
}

export default useWalletConnect
