import { useMemo } from 'react'

import FaceIDIcon from '@common/assets/svg/FaceIDIcon'
import FingerprintIcon from '@common/assets/svg/FingerprintIcon'
import { useTranslation } from '@common/config/localization'
import {
  DEVICE_SECURITY_LEVEL,
  DEVICE_SUPPORTED_AUTH_TYPES
} from '@common/contexts/biometricsContext/constants'
import useBiometrics from '@common/hooks/useBiometrics'

import { BiometricsAvailability } from './types'
import useCanUnlockWithBiometrics from './useCanUnlockWithBiometrics'

const useBiometricsAvailability = (): BiometricsAvailability => {
  const { t } = useTranslation()
  const { hasBiometricsHardware, isEnrolled, deviceSecurityLevel, deviceSupportedAuthTypes } =
    useBiometrics()

  const hasFaceId = deviceSupportedAuthTypes.includes(
    DEVICE_SUPPORTED_AUTH_TYPES.FACIAL_RECOGNITION
  )
  // A weak biometric (2D face unlock on Android) is not something a wallet should be unlocked
  // by, so only a strong one counts as usable at all.
  const isDeviceCapable =
    !!hasBiometricsHardware &&
    isEnrolled &&
    deviceSecurityLevel === DEVICE_SECURITY_LEVEL.BIOMETRIC_STRONG
  const canUnlockWithBiometrics = useCanUnlockWithBiometrics(isDeviceCapable)

  return useMemo(
    () => ({
      canEnableBiometrics: isDeviceCapable,
      canUnlockWithBiometrics,
      BiometricsIcon: hasFaceId ? FaceIDIcon : FingerprintIcon,
      biometricsAuthLabel: hasFaceId ? t('Face ID') : t('fingerprint')
    }),
    [isDeviceCapable, canUnlockWithBiometrics, hasFaceId, t]
  )
}

export default useBiometricsAvailability
