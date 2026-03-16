import { DEVICE_SECURITY_LEVEL, DEVICE_SUPPORTED_AUTH_TYPES } from './constants'

export interface BiometricsContextReturnType {
  deviceSecurityLevel: DEVICE_SECURITY_LEVEL
  deviceSupportedAuthTypes: DEVICE_SUPPORTED_AUTH_TYPES[]
  // Determine what kinds of authentications are available on the device.
  deviceSupportedAuthTypesLabel: string
  isLoading: boolean
  // Determines whether a face or fingerprint scanner is available on the device
  hasBiometricsHardware: null | boolean
  authenticateWithLocalAuth: () => Promise<boolean>
}

export const biometricsContextDefaults: BiometricsContextReturnType = {
  deviceSecurityLevel: DEVICE_SECURITY_LEVEL.NONE,
  deviceSupportedAuthTypes: [],
  deviceSupportedAuthTypesLabel: '',
  isLoading: true,
  hasBiometricsHardware: null,
  authenticateWithLocalAuth: () => Promise.resolve(false)
}
