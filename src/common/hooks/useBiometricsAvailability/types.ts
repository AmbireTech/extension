import React from 'react'
import { SvgProps } from 'react-native-svg'

export interface BiometricsAvailability {
  /**
   * Whether the app can offer to turn biometrics on. It asks about the device, not about this
   * wallet - a device that can authenticate but has no secret stored yet still answers `true`.
   */
  canEnableBiometrics: boolean
  /**
   * Whether biometrics can be used right now, to unlock or to confirm something. It asks about
   * the device and about this wallet, so it is `false` without a stored secret.
   */
  canUnlockWithBiometrics: boolean
  /** The icon for what the device actually authenticates with. */
  BiometricsIcon: React.FC<SvgProps>
  /** What to call it in a sentence, e.g. "Face ID" or "biometrics". */
  biometricsAuthLabel: string
}
