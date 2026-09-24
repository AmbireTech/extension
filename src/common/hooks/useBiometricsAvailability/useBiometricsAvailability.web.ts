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
  const { state: hasBiometricsSecret } = useController(
    'KeystoreController',
    selectHasBiometricsSecret
  )
  const { state: isPasswordUnlockRequired } = useController(
    'KeystoreController',
    selectIsPasswordUnlockRequired
  )
  const { isLoading, hasBiometricsHardware } = useBiometrics()

  // `hasBiometricsHardware` starts as null and is answered by WebAuthn, so until it is, the
  // honest answer is "not yet" rather than "no".
  const isDeviceCapable = !isLoading && !!hasBiometricsHardware
  // A secret left from before the user dropped their fingerprints cannot be read back, and the
  // password is the only way in while the keystore waits for the unlock that migrates it.
  const canUnlockWithBiometrics =
    isDeviceCapable && !!hasBiometricsSecret && !isPasswordUnlockRequired

  return useMemo(
    () => ({
      canEnableBiometrics: isDeviceCapable,
      canUnlockWithBiometrics,
      // WebAuthn never says which modality was used - Touch ID, Windows Hello and a phone passkey
      // all look the same from here - so the icon and the wording stay generic.
      BiometricsIcon: FingerprintIcon,
      biometricsAuthLabel: t('biometrics')
    }),
    [isDeviceCapable, canUnlockWithBiometrics, t]
  )
}

export default useBiometricsAvailability
