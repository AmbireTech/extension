import * as LocalAuthentication from 'expo-local-authentication'

// eslint-disable-next-line @typescript-eslint/naming-convention
export enum DEVICE_SECURITY_LEVEL {
  // Indicates no enrolled authentication
  NONE = LocalAuthentication.SecurityLevel.NONE,
  // Indicates non-biometric authentication (e.g. PIN, Pattern).
  SECRET = LocalAuthentication.SecurityLevel.SECRET,
  // Indicates weak biometric authentication (e.g. 2D face unlock — Android only).
  BIOMETRIC_WEAK = LocalAuthentication.SecurityLevel.BIOMETRIC_WEAK,
  // Indicates strong biometric authentication (e.g. fingerprint or 3D face scan).
  BIOMETRIC_STRONG = LocalAuthentication.SecurityLevel.BIOMETRIC_STRONG
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export enum DEVICE_SUPPORTED_AUTH_TYPES {
  FINGERPRINT = LocalAuthentication.AuthenticationType.FINGERPRINT,
  FACIAL_RECOGNITION = LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
  IRIS = LocalAuthentication.AuthenticationType.IRIS
}
