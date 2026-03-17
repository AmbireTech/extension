import * as LocalAuthentication from 'expo-local-authentication'
import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { Platform } from 'react-native'

import { useTranslation } from '@common/config/localization/localization'
import useToast from '@common/hooks/useToast'
import { getDeviceSupportedAuthTypesLabel } from '@common/services/device'
import { requestLocalAuthFlagging } from '@common/services/requestPermissionFlagging'
import { secureStorage } from '@common/services/storage'

import { DEVICE_SECURITY_LEVEL, DEVICE_SUPPORTED_AUTH_TYPES } from './constants'
import { biometricsContextDefaults, BiometricsContextReturnType } from './types'

const BIOMETRICS_SECRET_KEY = 'biometricsSecret_v2'

const BiometricsContext = createContext<BiometricsContextReturnType>(biometricsContextDefaults)

const BiometricsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation()
  const { addToast } = useToast()

  const [deviceSecurityLevel, setDeviceSecurityLevel] = useState<DEVICE_SECURITY_LEVEL>(
    biometricsContextDefaults.deviceSecurityLevel
  )
  const [deviceSupportedAuthTypes, setDeviceSupportedAuthTypes] = useState<
    DEVICE_SUPPORTED_AUTH_TYPES[]
  >(biometricsContextDefaults.deviceSupportedAuthTypes)
  const [deviceSupportedAuthTypesLabel, setDeviceSupportedAuthTypesLabel] = useState<string>(
    biometricsContextDefaults.deviceSupportedAuthTypesLabel
  )
  const [hasBiometricsHardware, setHasBiometricsHardware] = useState<null | boolean>(
    biometricsContextDefaults.hasBiometricsHardware
  )
  const [isEnrolled, setIsEnrolled] = useState<boolean>(biometricsContextDefaults.isEnrolled)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    ;(async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync()
        setHasBiometricsHardware(hasHardware)
      } catch {
        // Assume device doesn't have biometrics hardware, that's fine.
      }

      try {
        const enrolled = await LocalAuthentication.isEnrolledAsync()
        setIsEnrolled(enrolled)
      } catch {
        // Assume nothing is enrolled, that's fine.
      }

      try {
        const securityLevel = await LocalAuthentication.getEnrolledLevelAsync()
        const validSecurityLevels = Object.values(DEVICE_SECURITY_LEVEL) as number[]
        setDeviceSecurityLevel(
          validSecurityLevels.includes(securityLevel)
            ? (securityLevel as unknown as DEVICE_SECURITY_LEVEL)
            : DEVICE_SECURITY_LEVEL.NONE
        )
      } catch {
        // Assume the lowest device security level (the default one), that's fine.
      }

      try {
        const deviceAuthTypes =
          (await LocalAuthentication.supportedAuthenticationTypesAsync()) as unknown as DEVICE_SUPPORTED_AUTH_TYPES[]
        setDeviceSupportedAuthTypes(deviceAuthTypes)
        setDeviceSupportedAuthTypesLabel(getDeviceSupportedAuthTypesLabel(deviceAuthTypes))
      } catch {
        // Fallback with defaults, that's fine.
      }

      setIsLoading(false)
    })().catch(() => {})
    // Run once on mount — hardware capabilities and enrollment don't change
    // during a session and don't need to re-query on auth status changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const authenticate = useCallback(async () => {
    try {
      const { success } = await requestLocalAuthFlagging(() =>
        LocalAuthentication.authenticateAsync({
          promptMessage: t('Confirm your identity'),
          biometricsSecurityLevel: 'strong' // android only
        })
      )

      return success
    } catch (e) {
      addToast(t('Authentication attempt failed.') as string, { type: 'error' })
      return false
    }
  }, [addToast, t])

  const saveBiometricsSecret = useCallback(
    async (password: string) => {
      // on iOS secureStorage.set does not trigger the biometric prompt
      // so we need to trigger it manually

      if (Platform.OS === 'ios') {
        const success = await authenticate()
        if (!success) return false

        await secureStorage.remove(BIOMETRICS_SECRET_KEY)
      }

      try {
        await secureStorage.set(BIOMETRICS_SECRET_KEY, password)
        return true
      } catch (e) {
        return false
      }
    },
    [authenticate]
  )

  const getBiometricsSecret = useCallback(async () => {
    try {
      return await secureStorage.get(BIOMETRICS_SECRET_KEY, t('Confirm your identity'))
    } catch {
      return null
    }
  }, [t])

  return (
    <BiometricsContext.Provider
      value={useMemo(
        () => ({
          isLoading,
          hasBiometricsHardware,
          isEnrolled,
          deviceSecurityLevel,
          deviceSupportedAuthTypes,
          deviceSupportedAuthTypesLabel,
          authenticate,
          saveBiometricsSecret,
          getBiometricsSecret
        }),
        [
          isLoading,
          hasBiometricsHardware,
          isEnrolled,
          deviceSecurityLevel,
          deviceSupportedAuthTypes,
          deviceSupportedAuthTypesLabel,
          authenticate,
          saveBiometricsSecret,
          getBiometricsSecret
        ]
      )}
    >
      {children}
    </BiometricsContext.Provider>
  )
}

export { BiometricsContext, BiometricsProvider }
