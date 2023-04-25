import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { UseFormSetError } from 'react-hook-form'
import { StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import GradientBackgroundWrapper from '@common/components/GradientBackgroundWrapper'
import { useTranslation } from '@common/config/localization'
import useAccounts from '@common/hooks/useAccounts'
import useApproval from '@common/hooks/useApproval'
import useExtensionWallet from '@common/hooks/useExtensionWallet'
import useNavigation from '@common/hooks/useNavigation'
import useStorageController from '@common/hooks/useStorageController'
import useToast from '@common/hooks/useToast'
import { AUTH_STATUS } from '@common/modules/auth/constants/authStatus'
import useAuth from '@common/modules/auth/hooks/useAuth'
import { KEY_LOCK_KEYSTORE_WHEN_INACTIVE } from '@common/modules/vault/constants/storageKeys'
import { VAULT_STATUS } from '@common/modules/vault/constants/vaultStatus'
import useLockWhenInactive from '@common/modules/vault/hooks/useLockWhenInactive'
import useVaultBiometrics from '@common/modules/vault/hooks/useVaultBiometrics'
import ResetVaultScreen from '@common/modules/vault/screens/ResetVaultScreen'
import UnlockVaultScreen from '@common/modules/vault/screens/UnlockVaultScreen'
import { Controller } from '@common/modules/vault/services/VaultController'
import { VaultItem } from '@common/modules/vault/services/VaultController/types'
import flexboxStyles from '@common/styles/utils/flexbox'
import { isExtension } from '@web/constants/browserapi'
import { getUiType } from '@web/utils/uiType'

import styles from './styles'
import { vaultContextDefaults, VaultContextReturnType } from './types'

const VaultContext = createContext<VaultContextReturnType>(vaultContextDefaults)

const VaultProvider: React.FC = ({ children }) => {
  const { addToast } = useToast()
  const { navigate } = useNavigation()
  const { t } = useTranslation()
  const { extensionWallet } = useExtensionWallet()
  const { onRemoveAllAccounts } = useAccounts()
  const { getItem, setItem, storageControllerInstance } = useStorageController()
  const { resolveApproval } = useApproval()
  const {
    biometricsEnabled,
    getKeystorePassword,
    addKeystorePasswordToDeviceSecureStore,
    removeKeystorePasswordFromDeviceSecureStore
  } = useVaultBiometrics()
  const [shouldLockWhenInactive, setShouldLockWhenInactive] = useState(true)
  const { authStatus } = useAuth()
  const [shouldDisplayForgotPassword, setShouldDisplayForgotPassword] = useState(false)

  /**
   * For the extension, we need to get vault status from background.
   * For the web and mobile app, create a new instance of VaultController,
   * and use this instance (singleton) instead.
   */
  const vaultController = useMemo(
    () => !isExtension && storageControllerInstance && new Controller(storageControllerInstance),
    [storageControllerInstance]
  )
  const [vaultStatus, setVaultStatus] = useState<VAULT_STATUS>(VAULT_STATUS.LOADING)

  useEffect(() => {
    const shouldLockWhenInactiveSetting = getItem(KEY_LOCK_KEYSTORE_WHEN_INACTIVE)

    setShouldLockWhenInactive(
      typeof shouldLockWhenInactiveSetting === 'undefined'
        ? vaultContextDefaults.shouldLockWhenInactive
        : shouldLockWhenInactiveSetting
    )
  }, [getItem])

  const requestVaultControllerMethod = useCallback(
    ({ method, props }: { method: string; props?: { [key: string]: any } }) => {
      if (isExtension) {
        return extensionWallet!.requestVaultControllerMethod(method, props)
      }

      return vaultController[method](props)
    },
    [vaultController, extensionWallet]
  )

  useEffect(() => {
    const vault = getItem('vault')
    if (!vault) {
      setVaultStatus(VAULT_STATUS.NOT_INITIALIZED)
      return
    }

    requestVaultControllerMethod({
      method: 'isVaultUnlockedAsync'
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
        addToast(t('Error creating Ambire Key Store. Please try again later or contact support.'), {
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
      // The unlock is approval. When unlocking - we need to resolve the
      // approval to unlock in order to trigger the next approval in line
      if (getUiType().isNotification) {
        resolveApproval(true)
      }

      !!nextRoute && navigate(nextRoute)
      return Promise.resolve()
    },
    [
      addToast,
      t,
      requestVaultControllerMethod,
      addKeystorePasswordToDeviceSecureStore,
      resolveApproval,
      navigate
    ]
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
        addToast(t("Passwords don't match."), { error: true })
      }
    },
    [t, addToast, onRemoveAllAccounts, requestVaultControllerMethod]
  )

  const unlockVault = useCallback(
    async (
      // eslint-disable-next-line default-param-last
      { password: incomingPassword }: { password?: string } = {},
      setError: UseFormSetError<{ password: string }>
    ) => {
      let password = incomingPassword

      if (biometricsEnabled && !password) {
        try {
          const passwordComingFromBiometrics = await getKeystorePassword()
          if (passwordComingFromBiometrics) {
            password = passwordComingFromBiometrics
          }
        } catch (e) {
          // Resolve to allow continue forward, instead or rejecting,
          // otherwise it fires a warn (unhandled promise rejection).
          // Which technically should not be handled, because canceling
          // unlock is a valid scenario.
          return Promise.resolve()
        }
      }

      return requestVaultControllerMethod({
        method: 'unlockVault',
        props: { password }
      })
        .then(() => {
          setVaultStatus(VAULT_STATUS.UNLOCKED)
          // The unlock is approval. When unlocking - we need to resolve the
          // approval to unlock in order to trigger the next approval in line
          if (getUiType().isNotification) {
            resolveApproval(true)
          }
        })
        .catch((e) => {
          setError('password', { message: e?.message || e })
        })
    },
    [biometricsEnabled, getKeystorePassword, requestVaultControllerMethod, resolveApproval]
  )

  const lockVault = useCallback(
    (_vaultStatus?: VAULT_STATUS) => {
      requestVaultControllerMethod({
        method: 'lockVault',
        props: {}
      })
        .then((res: any) => {
          if (
            vaultStatus !== VAULT_STATUS.LOADING &&
            vaultStatus !== VAULT_STATUS.NOT_INITIALIZED
          ) {
            setVaultStatus(_vaultStatus || res)
          }
        })
        .catch((e) => {
          addToast(e?.message || e, { error: true })
        })
    },
    [addToast, requestVaultControllerMethod, vaultStatus]
  )

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

  const handleLockWhenInactive = useCallback(() => {
    // If no accounts are added, no need to lock the vault when inactive,
    // since there is no sensitive information to protect yet.
    if (authStatus !== AUTH_STATUS.AUTHENTICATED) {
      return
    }

    lockVault(VAULT_STATUS.LOCKED_TEMPORARILY)
  }, [authStatus, lockVault])

  useLockWhenInactive({
    vaultStatus,
    shouldLockWhenInactive,
    lock: handleLockWhenInactive,
    promptToUnlock: unlockVault,
    biometricsEnabled
  })

  const toggleShouldLockWhenInactive = useCallback(
    (shouldLock: boolean) => {
      setShouldLockWhenInactive(shouldLock)
      setItem(KEY_LOCK_KEYSTORE_WHEN_INACTIVE, shouldLock)
    },
    [setItem]
  )

  const handleToggleForgotPassword = useCallback(() => {
    setShouldDisplayForgotPassword((prev) => !prev)
  }, [])

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
          signMsgExternalSigner,
          shouldLockWhenInactive,
          toggleShouldLockWhenInactive,
          biometricsEnabled,
          getKeystorePassword,
          addKeystorePasswordToDeviceSecureStore,
          removeKeystorePasswordFromDeviceSecureStore
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
          signMsgExternalSigner,
          shouldLockWhenInactive,
          toggleShouldLockWhenInactive,
          biometricsEnabled,
          getKeystorePassword,
          addKeystorePasswordToDeviceSecureStore,
          removeKeystorePasswordFromDeviceSecureStore
        ]
      )}
    >
      {/* The temporarily locked state is implemented as an overlay. Why not */}
      {/* a separate route (as a modal)? It was conflicting with the async */}
      {/* navigation actions that were happening on some occasions */}
      {/* (like waiting for email confirm and on confirm - redirecting). */}
      {/* Implementing it as an overlay prevents all these problems, */}
      {/* all redirects are happening below overlay and when the overlay */}
      {/* gets dismissed - the current route is always up to date. */}
      {vaultStatus === VAULT_STATUS.LOCKED_TEMPORARILY && (
        <GradientBackgroundWrapper style={[StyleSheet.absoluteFill, styles.lockedContainer]}>
          <SafeAreaView
            style={
              // otherwise, the content disappears when the parent is absolute
              flexboxStyles.flex1
            }
          >
            {shouldDisplayForgotPassword ? (
              <ResetVaultScreen
                onGoBack={handleToggleForgotPassword}
                vaultStatus={vaultStatus}
                resetVault={resetVault}
                hasGradientBackground={false}
              />
            ) : (
              <UnlockVaultScreen
                onForgotPassword={handleToggleForgotPassword}
                unlockVault={unlockVault}
                vaultStatus={vaultStatus}
                biometricsEnabled={biometricsEnabled}
                hasGradientBackground={false}
              />
            )}
          </SafeAreaView>
        </GradientBackgroundWrapper>
      )}
      {children}
    </VaultContext.Provider>
  )
}

export { VaultContext, VaultProvider }
