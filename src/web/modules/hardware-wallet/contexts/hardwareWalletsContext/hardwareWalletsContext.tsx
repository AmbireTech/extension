import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'

import { HARDWARE_WALLETS } from '@web/modules/hardware-wallet/constants/common'
import LatticeController from '@web/modules/hardware-wallet/controllers/LatticeController'
import LedgerController from '@web/modules/hardware-wallet/controllers/LedgerController'
import TrezorController from '@web/modules/hardware-wallet/controllers/TrezorController'

import {
  HARDWARE_WALLETS_KEYS,
  hardwareWalletsContextDefaults,
  HardwareWalletsContextReturnType
} from './types'

const HardwareWalletsContext = createContext<HardwareWalletsContextReturnType>(
  hardwareWalletsContextDefaults
)

const HardwareWalletsProvider: React.FC<any> = ({ children }: any) => {
  const [hardwareWallets] = useState<HardwareWalletsContextReturnType['hardwareWallets']>({
    [HARDWARE_WALLETS.LEDGER]: new LedgerController(),
    [HARDWARE_WALLETS.GRIDPLUS]: new LatticeController()
  })

  const shouldRequestPermission = useCallback(
    (type: typeof HARDWARE_WALLETS[HARDWARE_WALLETS_KEYS]) => {
      if (type === HARDWARE_WALLETS.LEDGER) {
        return true
      }

      return false
    },
    []
  )

  return (
    <HardwareWalletsContext.Provider
      value={useMemo(
        () => ({
          hardwareWallets,
          shouldRequestPermission
        }),
        [hardwareWallets, shouldRequestPermission]
      )}
    >
      {children}
    </HardwareWalletsContext.Provider>
  )
}

export { HardwareWalletsContext, HardwareWalletsProvider }
