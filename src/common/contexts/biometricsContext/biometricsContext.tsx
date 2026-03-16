import * as LocalAuthentication from 'expo-local-authentication'
import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'

import { useTranslation } from '@common/config/localization/localization'
import useToast from '@common/hooks/useToast'
import useAuth from '@common/modules/auth/hooks/useAuth'
import { getDeviceSupportedAuthTypesLabel } from '@common/services/device'
import { requestLocalAuthFlagging } from '@common/services/requestPermissionFlagging'

import { DEVICE_SECURITY_LEVEL, DEVICE_SUPPORTED_AUTH_TYPES } from './constants'
import { biometricsContextDefaults, BiometricsContextReturnType } from './types'

const BiometricsContext = createContext<BiometricsContextReturnType>(biometricsContextDefaults)

const BiometricsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation()
  const { authStatus } = useAuth()
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
        const securityLevel = await LocalAuthentication.getEnrolledLevelAsync()
        const existingDeviceSecurityLevel =
          // @ts-ignore `LocalAuthentication.SecurityLevel` and `DEVICE_SECURITY_LEVEL`
          // overlap each other. So this should match.
          Object.values(DEVICE_SECURITY_LEVEL).includes(securityLevel)
        setDeviceSecurityLevel(
          // @ts-ignore `LocalAuthentication.SecurityLevel` and `DEVICE_SECURITY_LEVEL`
          // overlap each other. So this should always result a valid setting.
          existingDeviceSecurityLevel ? securityLevel : DEVICE_SECURITY_LEVEL.NONE
        )
      } catch {
        // Assume the lowest device security level (the default one), that's fine.
      }

      try {
        const deviceAuthTypes = await LocalAuthentication.supportedAuthenticationTypesAsync()
        // @ts-ignore `LocalAuthentication.AuthenticationType` and `DEVICE_SUPPORTED_AUTH_TYPES`
        // overlap each other. So these should match.
        setDeviceSupportedAuthTypes(deviceAuthTypes)
        // @ts-ignore `LocalAuthentication.AuthenticationType` and `DEVICE_SUPPORTED_AUTH_TYPES`
        // overlap each other. So these should match.
        setDeviceSupportedAuthTypesLabel(getDeviceSupportedAuthTypesLabel(deviceAuthTypes))
      } catch {
        // Fallback with defaults, that's fine.
      }

      setIsLoading(false)
    })()
  }, [authStatus])

  const authenticateWithLocalAuth = useCallback(async () => {
    try {
      const { success } = await requestLocalAuthFlagging(() =>
        LocalAuthentication.authenticateAsync({
          promptMessage: t('Confirm your identity')
        })
      )

      return success
    } catch (e) {
      addToast(t('Authentication attempt failed.') as string, { type: 'error' })
      return false
    }
  }, [addToast, t])

  return (
    <BiometricsContext.Provider
      value={useMemo(
        () => ({
          isLoading,
          hasBiometricsHardware,
          deviceSecurityLevel,
          deviceSupportedAuthTypes,
          deviceSupportedAuthTypesLabel,
          authenticateWithLocalAuth
        }),
        [
          isLoading,
          hasBiometricsHardware,
          deviceSecurityLevel,
          deviceSupportedAuthTypes,
          deviceSupportedAuthTypesLabel,
          authenticateWithLocalAuth
        ]
      )}
    >
      {children}
    </BiometricsContext.Provider>
  )
}

export { BiometricsContext, BiometricsProvider }
