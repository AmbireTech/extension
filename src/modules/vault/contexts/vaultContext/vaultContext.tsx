import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'

import { useTranslation } from '@config/localization'
import useBiometricsSign from '@modules/biometrics-sign/hooks/useBiometricsSign'
import useAccounts from '@modules/common/hooks/useAccounts'
import useStorageController from '@modules/common/hooks/useStorageController'
import useToast from '@modules/common/hooks/useToast'
import { navigate } from '@modules/common/services/navigation'
import { VAULT_STATUS } from '@modules/vault/constants/vaultStatus'
import useLockWhenInactive from '@modules/vault/hooks/useLockWhenInactive'
import VaultController from '@modules/vault/services/VaultController'
import { VaultItem } from '@modules/vault/services/VaultController/types'
import { isExtension } from '@web/constants/browserAPI'
import { BACKGROUND } from '@web/constants/paths'
import { sendMessage } from '@web/services/ambexMessanger'

import { vaultContextDefaults, VaultContextReturnType } from './types'

const VaultContext = createContext<VaultContextReturnType>(vaultContextDefaults)

const VaultProvider: React.FC = ({ children }) => {
  const { addToast } = useToast()
  const { t } = useTranslation()
  const { onRemoveAllAccounts } = useAccounts()
  const { getItem, storageControllerInstance } = useStorageController()
  const { biometricsEnabled, getKeystorePassword, addKeystorePasswordToDeviceSecureStore } =
    useBiometricsSign()
  // TODO: Make configurable
  const [lockWhenInactive, setLockWhenInactive] = useState(true)

  /**
   * For the extension, we need to get vault status from background.
   * For the web and mobile app, create a new instance of VaultController,
   * and use this instance (singleton) instead.
   */
  const vaultController = useMemo(
    () =>
      !isExtension && storageControllerInstance && new VaultController(storageControllerInstance),
    [storageControllerInstance]
  )
  const [vaultStatus, setVaultStatus] = useState<VAULT_STATUS>(VAULT_STATUS.LOADING)

  const requestVaultControllerMethod = useCallback(
    ({
      method,
      props,
      options
    }: {
      method: string
      props?: { [key: string]: any }
      options?: { [key: string]: any }
    }) => {
      if (isExtension) {
        return new Promise((resolve, reject) => {
          sendMessage(
            {
              type: 'vaultController',
              to: BACKGROUND,
              data: {
                method,
                props
              }
            },
            options || {}
          )
            .then((res: any) => resolve(res.data))
            .catch((err) => reject(err))
        })
      }

      return vaultController[method](props)
    },
    [vaultController]
  )

  useEffect(() => {
    const vault = getItem('vault')
    if (!vault) {
      setVaultStatus(VAULT_STATUS.NOT_INITIALIZED)
      return
    }

    requestVaultControllerMethod({
      method: 'isVaultUnlocked',
      // In case the background server is inactive wait less for the
      // (unhandled promise response) reply before showing the locked screen
      options: { replyTimeout: 1500 }
    })
      .then((isUnlocked: boolean) => {
        setVaultStatus(isUnlocked ? VAULT_STATUS.UNLOCKED : VAULT_STATUS.LOCKED)
      })
      .catch(() => setVaultStatus(VAULT_STATUS.LOCKED))
  }, [vaultController, getItem, requestVaultControllerMethod])

  const createVault = useCallback<VaultContextReturnType['createVault']>(
    async ({ password, confirmPassword, optInForBiometricsUnlock, nextRoute }) => {
      if (password !== confirmPassword) {
        addToast(t("Passwords don't match."), { error: true })
        return Promise.reject()
      }

      try {
        await requestVaultControllerMethod({
          method: 'createVault',
          props: { password }
        })
      } catch {
        addToast(t('Error creating Ambire keystore. Please try again later or contact support.'), {
          error: true
        })
        return Promise.reject()
      }

      if (optInForBiometricsUnlock) {
        try {
          await addKeystorePasswordToDeviceSecureStore(password)
        } catch {
          addToast(
            t(
              'Confirming Biometrics was unsuccessful. You can retry enabling Biometrics unlock later via the "Set Biometrics unlock" option in the menu'
            ),
            { error: true }
          )
        }
      }

      // Automatically unlock after vault initialization
      setVaultStatus(VAULT_STATUS.UNLOCKED)

      !!nextRoute && navigate(nextRoute)
      return Promise.resolve()
    },
    [requestVaultControllerMethod, addKeystorePasswordToDeviceSecureStore, addToast, t]
  )

  const resetVault = useCallback(
    ({
      password,
      confirmPassword
    }: {
      password: string
      confirmPassword: string
      nextRoute?: string
    }) => {
      if (password === confirmPassword) {
        requestVaultControllerMethod({
          method: 'resetVault',
          props: {
            password
          }
        }).then(() => {
          onRemoveAllAccounts()
          // Automatically unlock after vault initialization
          setVaultStatus(VAULT_STATUS.UNLOCKED)
        })
      } else {
        addToast(t("Passwords don't match."))
      }
    },
    [t, addToast, onRemoveAllAccounts, requestVaultControllerMethod]
  )

  const unlockVault = useCallback(
    async ({ password: incomingPassword }: { password?: string }) => {
      let password = incomingPassword

      if (biometricsEnabled && !password) {
        try {
          const passwordComingFromBiometrics = await getKeystorePassword()
          if (passwordComingFromBiometrics) {
            password = passwordComingFromBiometrics
          }
        } catch (e) {
          return Promise.reject()
        }
      }

      return requestVaultControllerMethod({
        method: 'unlockVault',
        props: { password }
      })
        .then(() => {
          setVaultStatus(VAULT_STATUS.UNLOCKED)
        })
        .catch((e) => {
          addToast(e?.message || e, { error: true })
        })
    },
    [addToast, biometricsEnabled, getKeystorePassword, requestVaultControllerMethod]
  )

  const lockVault = useCallback(() => {
    requestVaultControllerMethod({
      method: 'lockVault',
      props: {}
    })
      .then((res: any) => {
        if (vaultStatus !== VAULT_STATUS.LOADING && vaultStatus !== VAULT_STATUS.NOT_INITIALIZED) {
          setVaultStatus(res)
        }
      })
      .catch((e) => {
        addToast(e?.message || e, { error: true })
      })
  }, [addToast, vaultStatus, requestVaultControllerMethod])

  const isValidPassword = useCallback(
    async (props: { password: string }) => {
      const res = await requestVaultControllerMethod({
        method: 'isValidPassword',
        props
      })

      return res as boolean
    },
    [requestVaultControllerMethod]
  )

  const addToVault = useCallback(
    async (props: { addr: string; item: VaultItem }) => {
      const res = await requestVaultControllerMethod({
        method: 'addToVault',
        props
      })

      return res
    },
    [requestVaultControllerMethod]
  )

  const removeFromVault = useCallback(
    async (props: { addr: string }) => {
      const res = await requestVaultControllerMethod({
        method: 'removeFromVault',
        props
      })

      return res
    },
    [requestVaultControllerMethod]
  )

  const isSignerAddedToVault = useCallback(
    async (props: { addr: string }) => {
      const res = await requestVaultControllerMethod({
        method: 'isSignerAddedToVault',
        props
      })

      return res as boolean
    },
    [requestVaultControllerMethod]
  )

  const getSignerType = useCallback(
    async (props: { addr: string }) => {
      const res = await requestVaultControllerMethod({
        method: 'getSignerType',
        props
      })

      return res as string
    },
    [requestVaultControllerMethod]
  )

  const signTxnQuckAcc = useCallback(
    async (props: { finalBundle: any; primaryKeyBackup: string; signature: any }) => {
      const res = await requestVaultControllerMethod({
        method: 'signTxnQuckAcc',
        props
      })

      return res
    },
    [requestVaultControllerMethod]
  )

  const signTxnExternalSigner = useCallback(
    async (props: {
      finalBundle: any
      estimation: any
      feeSpeed: any
      account: any
      network: any
    }) => {
      const res = await requestVaultControllerMethod({
        method: 'signTxnExternalSigner',
        props
      })

      return res
    },
    [requestVaultControllerMethod]
  )

  const signMsgQuickAcc = useCallback(
    async (props: {
      account: any
      network: any
      msgToSign: any
      dataV4: any
      isTypedData: any
      signature: any
    }) => {
      const res = await requestVaultControllerMethod({
        method: 'signMsgQuickAcc',
        props
      })

      return res
    },
    [requestVaultControllerMethod]
  )

  const signMsgExternalSigner = useCallback(
    async (props: {
      account: any
      network: any
      msgToSign: any
      dataV4: any
      isTypedData: any
    }) => {
      const res = await requestVaultControllerMethod({
        method: 'signMsgExternalSigner',
        props
      })

      return res
    },
    [requestVaultControllerMethod]
  )

  useLockWhenInactive({
    lockWhenInactive,
    // TODO: Lock but do not unmount
    lock: lockVault,
    // TODO: Prompt to unlock
    promptToUnlock: () => null
  })

  return (
    <VaultContext.Provider
      value={useMemo(
        () => ({
          vaultStatus,
          createVault,
          resetVault,
          unlockVault,
          lockVault,
          isValidPassword,
          addToVault,
          removeFromVault,
          isSignerAddedToVault,
          getSignerType,
          signTxnQuckAcc,
          signTxnExternalSigner,
          signMsgQuickAcc,
          signMsgExternalSigner
        }),
        [
          vaultStatus,
          createVault,
          resetVault,
          unlockVault,
          lockVault,
          isValidPassword,
          addToVault,
          removeFromVault,
          isSignerAddedToVault,
          getSignerType,
          signTxnQuckAcc,
          signTxnExternalSigner,
          signMsgQuickAcc,
          signMsgExternalSigner
        ]
      )}
    >
      {children}
    </VaultContext.Provider>
  )
}

export { VaultContext, VaultProvider }
