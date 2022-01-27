import * as LocalAuthentication from 'expo-local-authentication'
import * as SecureStore from 'expo-secure-store'
import React, { createContext, useEffect, useMemo, useState } from 'react'
import { Platform, Vibration } from 'react-native'

import i18n from '@config/localization/localization'
import useAccountsPasswords from '@modules/common/hooks/useAccountsPasswords'
import { SECURE_STORE_KEY_PASSCODE } from '@modules/settings/constants'

// eslint-disable-next-line @typescript-eslint/naming-convention
export enum PASSCODE_STATES {
  NO_PASSCODE = 'NO_PASSCODE',
  PASSCODE_ONLY = 'PASSCODE_ONLY',
  PASSCODE_AND_LOCAL_AUTH = 'PASSCODE_AND_LOCAL_AUTH'
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export enum DEVICE_SECURITY_LEVEL {
  // Indicates no enrolled authentication
  NONE = LocalAuthentication.SecurityLevel.NONE,
  // Indicates non-biometric authentication (e.g. PIN, Pattern).
  SECRET = LocalAuthentication.SecurityLevel.SECRET,
  // Indicates biometric authentication
  BIOMETRIC = LocalAuthentication.SecurityLevel.BIOMETRIC
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export enum DEVICE_SUPPORTED_AUTH_TYPES {
  FINGERPRINT = LocalAuthentication.AuthenticationType.FINGERPRINT,
  FACIAL_RECOGNITION = LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
  IRIS = LocalAuthentication.AuthenticationType.IRIS
}

const getDeviceSupportedAuthTypesLabel = (types: DEVICE_SUPPORTED_AUTH_TYPES[]) => {
  if (Platform.OS === 'ios') {
    if (
      types.includes(DEVICE_SUPPORTED_AUTH_TYPES.FACIAL_RECOGNITION) &&
      types.includes(DEVICE_SUPPORTED_AUTH_TYPES.FINGERPRINT)
    ) {
      return i18n.t('Face ID or Touch ID')
    }

    if (types.includes(DEVICE_SUPPORTED_AUTH_TYPES.FACIAL_RECOGNITION)) {
      return i18n.t('Face ID')
    }

    if (types.includes(DEVICE_SUPPORTED_AUTH_TYPES.FINGERPRINT)) {
      return i18n.t('Touch ID')
    }
  }

  if (Platform.OS === 'android') {
    if (
      types.includes(DEVICE_SUPPORTED_AUTH_TYPES.FACIAL_RECOGNITION) &&
      types.includes(DEVICE_SUPPORTED_AUTH_TYPES.IRIS) &&
      types.includes(DEVICE_SUPPORTED_AUTH_TYPES.FINGERPRINT)
    ) {
      return i18n.t('facial recognition, iris recognition or fingerprint')
    }

    if (
      types.includes(DEVICE_SUPPORTED_AUTH_TYPES.IRIS) &&
      types.includes(DEVICE_SUPPORTED_AUTH_TYPES.FINGERPRINT)
    ) {
      return i18n.t('iris recognition or fingerprint')
    }

    if (
      types.includes(DEVICE_SUPPORTED_AUTH_TYPES.FACIAL_RECOGNITION) &&
      types.includes(DEVICE_SUPPORTED_AUTH_TYPES.FINGERPRINT)
    ) {
      return i18n.t('facial recognition or fingerprint')
    }

    if (
      types.includes(DEVICE_SUPPORTED_AUTH_TYPES.FACIAL_RECOGNITION) &&
      types.includes(DEVICE_SUPPORTED_AUTH_TYPES.IRIS)
    ) {
      return i18n.t('facial recognition or iris recognition')
    }

    if (types.includes(DEVICE_SUPPORTED_AUTH_TYPES.FACIAL_RECOGNITION)) {
      return i18n.t('facial recognition')
    }

    if (types.includes(DEVICE_SUPPORTED_AUTH_TYPES.IRIS)) {
      return i18n.t('iris recognition')
    }

    if (types.includes(DEVICE_SUPPORTED_AUTH_TYPES.FINGERPRINT)) {
      return i18n.t('fingerprint')
    }
  }

  return ''
}

type PasscodeContextData = {
  state: PASSCODE_STATES
  deviceSecurityLevel: DEVICE_SECURITY_LEVEL
  deviceSupportedAuthTypes: DEVICE_SUPPORTED_AUTH_TYPES[]
  deviceSupportedAuthTypesLabel: string
  fallbackSupportedAuthTypesLabel: string
  addPasscode: (code: string) => Promise<void>
  removePasscode: () => Promise<void>
  isLoading: boolean
  isValidPasscode: (code: string) => boolean
  isLocalAuthSupported: null | boolean
  addLocalAuth: () => void
  removeLocalAuth: () => void
  isValidLocalAuth: () => Promise<boolean>
}

const defaults: PasscodeContextData = {
  state: PASSCODE_STATES.NO_PASSCODE,
  deviceSecurityLevel: DEVICE_SECURITY_LEVEL.NONE,
  deviceSupportedAuthTypes: [],
  deviceSupportedAuthTypesLabel: '',
  fallbackSupportedAuthTypesLabel: '',
  addPasscode: () => Promise.resolve(),
  removePasscode: () => Promise.resolve(),
  isLoading: true,
  isValidPasscode: () => false,
  isLocalAuthSupported: null,
  addLocalAuth: () => {},
  removeLocalAuth: () => {},
  isValidLocalAuth: () => Promise.resolve(false)
}

const PasscodeContext = createContext<PasscodeContextData>(defaults)

const PasscodeProvider: React.FC = ({ children }) => {
  const { selectedAccHasPassword, removeSelectedAccPassword } = useAccountsPasswords()
  const [state, setState] = useState<PASSCODE_STATES>(defaults.state)
  const [deviceSecurityLevel, setDeviceSecurityLevel] = useState<DEVICE_SECURITY_LEVEL>(
    defaults.deviceSecurityLevel
  )
  const [deviceSupportedAuthTypes, setDeviceSupportedAuthTypes] = useState<
    DEVICE_SUPPORTED_AUTH_TYPES[]
  >(defaults.deviceSupportedAuthTypes)
  const [deviceSupportedAuthTypesLabel, setDeviceSupportedAuthTypesLabel] = useState<string>(
    defaults.deviceSupportedAuthTypesLabel
  )
  const [passcode, setPasscode] = useState<null | string>(null)
  const [isLocalAuthSupported, setIsLocalAuthSupported] = useState<null | boolean>(
    defaults.isLocalAuthSupported
  )
  const [isLoading, setIsLoading] = useState<boolean>(defaults.isLoading)

  useEffect(() => {
    ;(async () => {
      // Check if hardware supports local authentication
      try {
        const isCompatible = await LocalAuthentication.hasHardwareAsync()
        setIsLocalAuthSupported(isCompatible)
      } catch (e) {
        // fail silently
      }

      try {
        const secureStoreItemPasscode = await SecureStore.getItemAsync(SECURE_STORE_KEY_PASSCODE)
        if (secureStoreItemPasscode) {
          setPasscode(secureStoreItemPasscode)
          setState(PASSCODE_STATES.PASSCODE_ONLY)
        }
      } catch (e) {
        // fail silently
      }

      try {
        const isEnrolled = await LocalAuthentication.isEnrolledAsync()
        if (isEnrolled) {
          setState(PASSCODE_STATES.PASSCODE_AND_LOCAL_AUTH)
        }
      } catch (e) {
        // fail silently
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
      } catch (e) {
        // fail silently
      }

      try {
        const deviceAuthTypes = await LocalAuthentication.supportedAuthenticationTypesAsync()
        // @ts-ignore `LocalAuthentication.AuthenticationType` and `DEVICE_SUPPORTED_AUTH_TYPES`
        // overlap each other. So these should match.
        setDeviceSupportedAuthTypes(deviceAuthTypes)
        // @ts-ignore `LocalAuthentication.AuthenticationType` and `DEVICE_SUPPORTED_AUTH_TYPES`
        // overlap each other. So these should match.
        setDeviceSupportedAuthTypesLabel(getDeviceSupportedAuthTypesLabel(deviceAuthTypes))
      } catch (e) {
        // fail silently
      }

      setIsLoading(false)
    })()
  }, [])

  const addLocalAuth = async () => {
    const { success } = await LocalAuthentication.authenticateAsync()

    if (success) {
      setState(PASSCODE_STATES.PASSCODE_AND_LOCAL_AUTH)
    }
  }
  const removeLocalAuth = async () => {
    await LocalAuthentication.cancelAuthenticate()

    setState(PASSCODE_STATES.PASSCODE_ONLY)
  }
  const isValidLocalAuth = async () => {
    const { success } = await LocalAuthentication.authenticateAsync()

    return success
  }

  const addPasscode = async (code: string) => {
    try {
      await SecureStore.setItemAsync(SECURE_STORE_KEY_PASSCODE, code)
    } catch (e) {
      // Fail silently. Means that will still set a passcode,
      // however, it won't store it in the secure storage and therefore,
      // on the next app load - the passcode won't be persisted.
      // Not great, not terrible.
    }

    setPasscode(code)
    setState(
      // Covers the case coming from a state with passcode already set
      state === PASSCODE_STATES.PASSCODE_AND_LOCAL_AUTH
        ? PASSCODE_STATES.PASSCODE_AND_LOCAL_AUTH
        : PASSCODE_STATES.PASSCODE_ONLY
    )
  }
  const removePasscode = async () => {
    // First, remove the local auth (if set), because without passcode
    // using local auth is not allowed.
    try {
      if (state === PASSCODE_STATES.PASSCODE_AND_LOCAL_AUTH) {
        await removeLocalAuth()
      }
    } catch (e) {
      // fail silently
    }

    try {
      // And remove the account password stored too, because without passcode,
      // this is not allowed neither.
      if (selectedAccHasPassword) {
        await removeSelectedAccPassword()
      }
    } catch (e) {
      // fail silently
    }

    try {
      await SecureStore.deleteItemAsync(SECURE_STORE_KEY_PASSCODE)
    } catch (e) {
      // fail silently
    }

    setPasscode(null)

    return setState(PASSCODE_STATES.NO_PASSCODE)
  }
  const isValidPasscode = (code: string) => {
    const isValid = code === passcode

    if (!isValid) Vibration.vibrate()

    return isValid
  }

  const fallbackSupportedAuthTypesLabel =
    Platform.select({
      ios: i18n.t('passcode'),
      android: i18n.t('PIN / pattern')
    }) || defaults.fallbackSupportedAuthTypesLabel

  return (
    <PasscodeContext.Provider
      value={useMemo(
        () => ({
          addPasscode,
          removePasscode,
          isLoading,
          isValidPasscode,
          isLocalAuthSupported,
          addLocalAuth,
          removeLocalAuth,
          isValidLocalAuth,
          state,
          deviceSecurityLevel,
          deviceSupportedAuthTypes,
          deviceSupportedAuthTypesLabel,
          fallbackSupportedAuthTypesLabel
        }),
        [
          isLoading,
          isLocalAuthSupported,
          deviceSecurityLevel,
          deviceSupportedAuthTypes,
          deviceSupportedAuthTypesLabel,
          fallbackSupportedAuthTypesLabel,
          state
        ]
      )}
    >
      {children}
    </PasscodeContext.Provider>
  )
}

export { PasscodeContext, PasscodeProvider }
