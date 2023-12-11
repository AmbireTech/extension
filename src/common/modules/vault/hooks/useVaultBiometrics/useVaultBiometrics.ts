import * as SecureStore from 'expo-secure-store'
import { useCallback, useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

import { useTranslation } from '@common/config/localization'
import useStorageController from '@common/hooks/useStorageController'
import useToast from '@common/hooks/useToast'
import { SECURE_STORE_KEY_KEYSTORE_PASSWORD } from '@common/modules/vault/constants/storageKeys'
import { requestLocalAuthFlagging } from '@common/services/requestPermissionFlagging'

import { useVaultBiometricsDefaults, UseVaultBiometricsReturnType } from './types'

const useVaultBiometrics = (): UseVaultBiometricsReturnType => {
  const { addToast } = useToast()
  const { t } = useTranslation()
  const { getItem, setItem, removeItem } = useStorageController()
  const [biometricsEnabled, setBiometricsEnabled] = useState<boolean>(
    useVaultBiometricsDefaults.biometricsEnabled
  )

  useEffect(() => {
    // Checks via a flag in the Async Storage (that in the Async Storage holds
    // the uuid of the key in the Secure Storage). Because otherwise, figuring
    // out if the selected account has password via the `SecureStore` requires
    // the user every time to authenticate via his phone local auth.
    const hasBiometricsEnabled = !!getItem(SECURE_STORE_KEY_KEYSTORE_PASSWORD)

    setBiometricsEnabled(hasBiometricsEnabled)
  }, [getItem])

  const addKeystorePasswordToDeviceSecureStore = useCallback(
    async (password: string) => {
      const uuid = uuidv4()
      const key = `${SECURE_STORE_KEY_KEYSTORE_PASSWORD}-${uuid}`
      await requestLocalAuthFlagging(() =>
        SecureStore.setItemAsync(key, password, {
          authenticationPrompt: t('Confirm your identity'),
          requireAuthentication: true,
          keychainService: key
        })
      )

      // To use it later 1) as a flag if the selected account has password
      // stored in the device secure store and 2) to retrieve the uuid of the
      // key in the Secure Storage.
      setItem(SECURE_STORE_KEY_KEYSTORE_PASSWORD, uuid)

      setBiometricsEnabled(true)
      return true
    },
    [t, setItem]
  )

  const getSecureStoreKey = useCallback(() => {
    const uuid = getItem(SECURE_STORE_KEY_KEYSTORE_PASSWORD)

    // The 'true' is a fallback for the versions of Ambire <= v3.12.0, where
    // this storage key was just used as a flag to indicate if the biometrics
    // are enabled or not (set to 'true' if enabled).
    return uuid === 'true'
      ? SECURE_STORE_KEY_KEYSTORE_PASSWORD
      : `${SECURE_STORE_KEY_KEYSTORE_PASSWORD}-${uuid}`
  }, [getItem])

  const removeKeystorePasswordFromDeviceSecureStore = useCallback(async () => {
    try {
      const key = getSecureStoreKey()

      await requestLocalAuthFlagging(() =>
        SecureStore.deleteItemAsync(key, {
          authenticationPrompt: t('Confirm your identity'),
          requireAuthentication: true,
          keychainService: key
        })
      )

      removeItem(key)
      setBiometricsEnabled(false)

      return true
    } catch (e) {
      addToast(t('Removing account password failed.') as string, { error: true })
      return false
    }
  }, [getSecureStoreKey, removeItem, t, addToast])

  const getKeystorePassword = useCallback(() => {
    const key = getSecureStoreKey()

    return requestLocalAuthFlagging(() =>
      SecureStore.getItemAsync(key, {
        authenticationPrompt: t('Confirm your identity'),
        requireAuthentication: true,
        keychainService: key
      })
    )
  }, [getSecureStoreKey, t])

  return {
    biometricsEnabled,
    getKeystorePassword,
    addKeystorePasswordToDeviceSecureStore,
    removeKeystorePasswordFromDeviceSecureStore
  }
}

export default useVaultBiometrics
