import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import DarkThemeIcon from '@common/assets/svg/DarkThemeIcon'
import LightThemeIcon from '@common/assets/svg/LightThemeIcon'
import SystemThemeIcon from '@common/assets/svg/SystemThemeIcon'
import ControlOption from '@common/components/ControlOption'
import FatToggle from '@common/components/FatToggle'
import { DEVICE_SECURITY_LEVEL } from '@common/contexts/biometricsContext/constants'
import useBiometrics from '@common/hooks/useBiometrics'
import useController from '@common/hooks/useController'
import useExtraEntropy from '@common/hooks/useExtraEntropy'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'

const BiometricsOption = () => {
  const { t } = useTranslation()
  const { selectedThemeType } = useTheme()
  const { isEnrolled, deviceSecurityLevel, saveBiometricsSecret, removeBiometricsSecret } =
    useBiometrics()
  const { getExtraEntropy } = useExtraEntropy()

  const {
    state: { hasBiometricsSecret, statuses },
    dispatch: keystoreDispatch
  } = useController('KeystoreController')

  // The secret is stored behind a key that only a strong (Class 3) biometric can release,
  // so a weak one (e.g. 2D face unlock on Android) would fail to save it.
  const isStrongBiometricsEnrolled =
    isEnrolled && deviceSecurityLevel === DEVICE_SECURITY_LEVEL.BIOMETRIC_STRONG

  if (!isStrongBiometricsEnrolled) return null

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    if (statuses.removeSecret === 'SUCCESS') removeBiometricsSecret()
  }, [removeBiometricsSecret, statuses.removeSecret])

  const toggleBiometrics = async () => {
    if (hasBiometricsSecret) {
      keystoreDispatch({
        type: 'method',
        params: {
          method: 'removeSecret',
          args: ['biometrics']
        }
      })
    } else {
      const secret = await saveBiometricsSecret()
      if (!secret) return

      keystoreDispatch({
        type: 'method',
        params: {
          method: 'addSecret',
          args: ['biometrics', secret, getExtraEntropy(), true]
        }
      })
    }
  }

  return (
    <ControlOption
      title={t('Biometrics unlock')}
      description={t('Use biometrics to unlock your wallet.')}
      style={spacings.mbTy}
      renderIcon={
        selectedThemeType === THEME_TYPES.SYSTEM ? (
          <SystemThemeIcon />
        ) : selectedThemeType === THEME_TYPES.DARK ? (
          <DarkThemeIcon />
        ) : (
          <LightThemeIcon />
        )
      }
    >
      <FatToggle isOn={hasBiometricsSecret} onToggle={toggleBiometrics} style={spacings.mr0} />
    </ControlOption>
  )
}

export default React.memo(BiometricsOption)
