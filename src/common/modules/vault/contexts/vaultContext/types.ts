import { isWeb } from '@common/config/env'
import { ROUTES } from '@common/modules/router/constants/common'
import { VAULT_STATUS } from '@common/modules/vault/constants/vaultStatus'
import {
  useVaultBiometricsDefaults,
  UseVaultBiometricsReturnType
} from '@common/modules/vault/hooks/useVaultBiometrics/types'
import { VaultItem } from '@common/modules/vault/services/VaultController/types'

// eslint-disable-next-line @typescript-eslint/naming-convention
export enum VAULT_PASSWORD_TYPE {
  PASSPHRASE = 'PASSPHRASE',
  PIN = 'PIN'
}

export interface VaultContextReturnType extends UseVaultBiometricsReturnType {
  vaultStatus: VAULT_STATUS
  vaultPasswordType: VAULT_PASSWORD_TYPE
  createVault: ({
    password,
    confirmPassword,
    optInForBiometricsUnlock,
    nextRoute
  }: {
    password: string
    confirmPassword: string
    optInForBiometricsUnlock: boolean
    nextRoute?: ROUTES
  }) => Promise<any>
  resetVault: ({ password, confirmPassword }: { password: string; confirmPassword: string }) => void
  unlockVault: ({ password }: { password: string }) => Promise<any>
  lockVault: () => void
  shouldLockWhenInactive: boolean
  toggleShouldLockWhenInactive: (shouldLock: boolean) => void
  isValidPassword: ({ password }: { password: string }) => Promise<boolean>
  addToVault: ({ addr, item }: { addr: string; item: VaultItem }) => Promise<any>
  removeFromVault: ({ addr }: { addr: string }) => Promise<any>
  isSignerAddedToVault: ({ addr }: { addr: string }) => Promise<boolean>
  getSignerType: ({ addr }: { addr: string }) => Promise<string>
  signTxnQuckAcc: (props: {
    finalBundle: any
    primaryKeyBackup: string
    signature: any
  }) => Promise<any>
  signTxnExternalSigner: (props: {
    finalBundle: any
    estimation: any
    feeSpeed: any
    account: any
    network: any
  }) => Promise<any>
  signMsgQuickAcc: (props: {
    account: any
    network: any
    msgToSign: any
    dataV4: any
    isTypedData: any
    signature: any
  }) => Promise<any>
  signMsgExternalSigner: (props: {
    account: any
    network: any
    msgToSign: any
    dataV4: any
    isTypedData: any
  }) => Promise<any>
}

export const vaultContextDefaults: VaultContextReturnType = {
  vaultStatus: VAULT_STATUS.LOADING,
  vaultPasswordType: VAULT_PASSWORD_TYPE.PASSPHRASE,
  createVault: () => Promise.resolve(),
  resetVault: () => {},
  unlockVault: () => Promise.resolve(false),
  lockVault: () => {},
  shouldLockWhenInactive: !isWeb,
  toggleShouldLockWhenInactive: () => {},
  isValidPassword: () => Promise.resolve(false),
  addToVault: () => Promise.resolve(false),
  removeFromVault: () => Promise.resolve(false),
  getSignerType: () => Promise.resolve(''),
  isSignerAddedToVault: () => Promise.resolve(false),
  signTxnQuckAcc: () => Promise.resolve(false),
  signTxnExternalSigner: () => Promise.resolve(false),
  signMsgQuickAcc: () => Promise.resolve(false),
  signMsgExternalSigner: () => Promise.resolve(false),
  ...useVaultBiometricsDefaults
}
