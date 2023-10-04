import { useContext } from 'react'

import { HardwareWalletsContext } from '@web/modules/hardware-wallet/contexts/hardwareWalletsContext'

export default function useHardwareWallets() {
  const context = useContext(HardwareWalletsContext)

  if (!context) {
    throw new Error('useHardwareWallets must be used within an HardwareWalletsProvider')
  }

  return context
}
