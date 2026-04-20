import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'

import { useTranslation } from '@common/config/localization/localization'
import {
  biometricsContextDefaults,
  BiometricsContextReturnType
} from '@common/contexts/biometricsContext/types'
import useController from '@common/hooks/useController'
import useToast from '@common/hooks/useToast'
import { webauthnBiometrics } from '@web/services/webauthnBiometrics'
import { getExtensionInstanceId } from '@web/utils/analytics'

import { DEVICE_SECURITY_LEVEL, DEVICE_SUPPORTED_AUTH_TYPES } from './constants'

const BiometricsContext = createContext<BiometricsContextReturnType>(biometricsContextDefaults)

const BiometricsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const {
    state: { keyStoreUid }
  } = useController('KeystoreController')
  const {
    state: { verifiedCode }
  } = useController('InviteController')

  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [hasBiometricsHardware, setHasBiometricsHardware] = useState<null | boolean>(
    biometricsContextDefaults.hasBiometricsHardware
  )
  const [isEnrolled, setIsEnrolled] = useState<boolean>(biometricsContextDefaults.isEnrolled)

  useEffect(() => {
    let isMounted = true

    ;(async () => {
      const isSupported = await webauthnBiometrics.isSupported()
      const hasStoredCredential = isSupported
        ? await webauthnBiometrics.hasStoredCredential()
        : false

      if (!isMounted) return

      setHasBiometricsHardware(isSupported)
      setIsEnrolled(hasStoredCredential)
      setIsLoading(false)
    })().catch(() => {
      if (!isMounted) return

      setHasBiometricsHardware(false)
      setIsEnrolled(false)
      setIsLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [])

  const authenticate = useCallback(async () => {
    try {
      return await webauthnBiometrics.authenticate()
    } catch {
      addToast(t('Authentication attempt failed.'), { type: 'error' })
      return false
    }
  }, [addToast, t])

  const saveBiometricsSecret = useCallback(async () => {
    try {
      const secret = await webauthnBiometrics.createSecret(
        Buffer.from(getExtensionInstanceId(keyStoreUid, verifiedCode))
      )
      setIsEnrolled(!!secret)
      return secret
    } catch (e) {
      console.log('Failed to save biometrics secret', e)
      return null
    }
  }, [keyStoreUid, verifiedCode])

  const getBiometricsSecret = useCallback(async () => {
    try {
      return await webauthnBiometrics.getSecret()
    } catch (e) {
      console.log('Failed to get biometrics secret', e)
      return null
    }
  }, [])

  const removeBiometricsSecret = useCallback(async () => {
    await webauthnBiometrics.removeCredential().catch((e) => {
      console.log('Failed to remove the webauthnBiometrics credential', e)
    })
    setIsEnrolled(false)
  }, [])

  return (
    <BiometricsContext.Provider
      value={useMemo(
        () => ({
          isLoading,
          hasBiometricsHardware,
          isEnrolled,
          deviceSecurityLevel: hasBiometricsHardware
            ? DEVICE_SECURITY_LEVEL.BIOMETRIC_STRONG
            : DEVICE_SECURITY_LEVEL.NONE,
          deviceSupportedAuthTypes: hasBiometricsHardware
            ? [DEVICE_SUPPORTED_AUTH_TYPES.FINGERPRINT]
            : [],
          deviceSupportedAuthTypesLabel: hasBiometricsHardware ? t('biometrics') : '',
          authenticate,
          saveBiometricsSecret,
          getBiometricsSecret,
          removeBiometricsSecret
        }),
        [
          hasBiometricsHardware,
          isEnrolled,
          isLoading,
          t,
          authenticate,
          saveBiometricsSecret,
          getBiometricsSecret,
          removeBiometricsSecret
        ]
      )}
    >
      <View style={{ flex: 1 }}>{children}</View>
    </BiometricsContext.Provider>
  )
}

export { BiometricsContext, BiometricsProvider }
