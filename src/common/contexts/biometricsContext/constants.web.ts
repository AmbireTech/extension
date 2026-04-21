// eslint-disable-next-line @typescript-eslint/naming-convention
export enum DEVICE_SECURITY_LEVEL {
  NONE = 0,
  SECRET = 1,
  BIOMETRIC_WEAK = 2,
  BIOMETRIC_STRONG = 3
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export enum DEVICE_SUPPORTED_AUTH_TYPES {
  FINGERPRINT = 1,
  FACIAL_RECOGNITION = 2,
  IRIS = 3
}
