import { useMemo } from 'react'

import FaceIDIcon from '@common/assets/svg/FaceIDIcon'
import FingerprintIcon from '@common/assets/svg/FingerprintIcon'
import { useTranslation } from '@common/config/localization'
import {
  DEVICE_SECURITY_LEVEL,
  DEVICE_SUPPORTED_AUTH_TYPES
} from '@common/contexts/biometricsContext/constants'
import useBiometrics from '@common/hooks/useBiometrics'
import useController from '@common/hooks/useController'

import { BiometricsAvailability } from './types'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

// One value each, read off the state rather than built, so the store's reconciled snapshots stay
// reference stable. A selector that allocates returns a new value on every read and never settles.
const selectHasBiometricsSecret = (state: AllControllersMappingType['KeystoreController']) =>
  state.hasBiometricsSecret
const selectIsPasswordUnlockRequired = (state: AllControllersMappingType['KeystoreController']) =>
  state.isPasswordUnlockRequired

const useBiometricsAvailability = (): BiometricsAvailability => {
  const { t } = useTranslation()
  const { hasBiometricsHardware, isEnrolled, deviceSecurityLevel, deviceSupportedAuthTypes } =
    useBiometrics()
  const { state: hasBiometricsSecret } = useController(
    'KeystoreController',
    selectHasBiometricsSecret
  )
  const { state: isPasswordUnlockRequired } = useController(
    'KeystoreController',
    selectIsPasswordUnlockRequired
  )

  const hasFaceId = deviceSupportedAuthTypes.includes(
    DEVICE_SUPPORTED_AUTH_TYPES.FACIAL_RECOGNITION
  )

  return useMemo(() => {
    // A weak biometric (2D face unlock on Android) is not something a wallet should be unlocked
    // by, so only a strong one counts as usable at all.
    const isDeviceCapable =
      !!hasBiometricsHardware &&
      isEnrolled &&
      deviceSecurityLevel === DEVICE_SECURITY_LEVEL.BIOMETRIC_STRONG

    return {
      canEnableBiometrics: isDeviceCapable,
      // A secret left over from before the user dropped their fingerprints cannot be read back,
      // so the device has to still be capable - and the password is the only way in while the
      // keystore is waiting for the one unlock that migrates it.
      canUnlockWithBiometrics:
        isDeviceCapable && !!hasBiometricsSecret && !isPasswordUnlockRequired,
      BiometricsIcon: hasFaceId ? FaceIDIcon : FingerprintIcon,
      biometricsAuthLabel: hasFaceId ? t('Face ID') : t('fingerprint')
    }
  }, [
    hasBiometricsHardware,
    isEnrolled,
    deviceSecurityLevel,
    hasBiometricsSecret,
    isPasswordUnlockRequired,
    hasFaceId,
    t
  ])
}

export default useBiometricsAvailability
