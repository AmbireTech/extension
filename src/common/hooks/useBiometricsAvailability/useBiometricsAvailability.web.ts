import { useMemo } from 'react'

import FingerprintIcon from '@common/assets/svg/FingerprintIcon'
import { useTranslation } from '@common/config/localization'
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
  const { isLoading, hasBiometricsHardware } = useBiometrics()
  const { state: hasBiometricsSecret } = useController(
    'KeystoreController',
    selectHasBiometricsSecret
  )
  const { state: isPasswordUnlockRequired } = useController(
    'KeystoreController',
    selectIsPasswordUnlockRequired
  )

  return useMemo(() => {
    // `hasBiometricsHardware` starts as null and is answered by WebAuthn, so until it is, the
    // honest answer is "not yet" rather than "no".
    const isDeviceCapable = !isLoading && !!hasBiometricsHardware

    return {
      canEnableBiometrics: isDeviceCapable,
      // The password is the only way in while the keystore is waiting for the one unlock that
      // migrates it.
      canUnlockWithBiometrics:
        isDeviceCapable && !!hasBiometricsSecret && !isPasswordUnlockRequired,
      // WebAuthn never says which modality the platform authenticator used - Touch ID, Windows
      // Hello and a phone passkey all look the same from here - so the icon and the wording stay
      // generic rather than claiming something that may be wrong.
      BiometricsIcon: FingerprintIcon,
      biometricsAuthLabel: t('biometrics')
    }
  }, [isLoading, hasBiometricsHardware, hasBiometricsSecret, isPasswordUnlockRequired, t])
}

export default useBiometricsAvailability
