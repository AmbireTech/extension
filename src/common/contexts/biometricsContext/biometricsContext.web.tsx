import React, { createContext, useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'

import { useTranslation } from '@common/config/localization/localization'
import {
  biometricsContextDefaults,
  BiometricsContextReturnType
} from '@common/contexts/biometricsContext/types'
import useToast from '@common/hooks/useToast'
import { webauthnBiometrics } from '@web/services/webauthnBiometrics'

import { DEVICE_SECURITY_LEVEL, DEVICE_SUPPORTED_AUTH_TYPES } from './constants'

const BiometricsContext = createContext<BiometricsContextReturnType>(biometricsContextDefaults)

const BiometricsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation()
  const { addToast } = useToast()

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
          authenticate: async () => {
            try {
              return await webauthnBiometrics.authenticate()
            } catch {
              addToast(t('Authentication attempt failed.') as string, { type: 'error' })
              return false
            }
          },
          saveBiometricsSecret: async () => {
            try {
              const secret = await webauthnBiometrics.createSecret()
              setIsEnrolled(!!secret)
              return secret
            } catch {
              return null
            }
          },
          getBiometricsSecret: async () => {
            try {
              return await webauthnBiometrics.getSecret()
            } catch {
              return null
            }
          },
          removeBiometricsSecret: async () => {
            await webauthnBiometrics.removeCredential()
            setIsEnrolled(false)
          }
        }),
        [addToast, hasBiometricsHardware, isEnrolled, isLoading, t]
      )}
    >
      <View style={{ flex: 1 }}>{children}</View>
    </BiometricsContext.Provider>
  )
}

export { BiometricsContext, BiometricsProvider }
