import { useMemo } from 'react'

import FingerprintIcon from '@common/assets/svg/FingerprintIcon'
import { useTranslation } from '@common/config/localization'
import useBiometrics from '@common/hooks/useBiometrics'

import { BiometricsAvailability } from './types'
import useCanUnlockWithBiometrics from './useCanUnlockWithBiometrics'

const useBiometricsAvailability = (): BiometricsAvailability => {
  const { t } = useTranslation()
  const { isLoading, hasBiometricsHardware } = useBiometrics()

  // `hasBiometricsHardware` starts as null and is answered by WebAuthn, so until it is, the
  // honest answer is "not yet" rather than "no".
  const isDeviceCapable = !isLoading && !!hasBiometricsHardware
  const canUnlockWithBiometrics = useCanUnlockWithBiometrics(isDeviceCapable)

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
