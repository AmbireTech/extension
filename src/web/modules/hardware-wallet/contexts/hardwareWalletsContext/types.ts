import { HARDWARE_WALLETS } from '@web/modules/hardware-wallet/constants/common'

// eslint-disable-next-line @typescript-eslint/naming-convention
export type HARDWARE_WALLETS_KEYS = keyof typeof HARDWARE_WALLETS

export interface HardwareWalletsContextReturnType {
  hardwareWallets: { [key: typeof HARDWARE_WALLETS[HARDWARE_WALLETS_KEYS]]: any }
}

export const hardwareWalletsContextDefaults: HardwareWalletsContextReturnType = {
  hardwareWallets: {}
}
