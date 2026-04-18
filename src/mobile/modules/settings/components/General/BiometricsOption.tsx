import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import DarkThemeIcon from '@common/assets/svg/DarkThemeIcon'
import LightThemeIcon from '@common/assets/svg/LightThemeIcon'
import SystemThemeIcon from '@common/assets/svg/SystemThemeIcon'
import ControlOption from '@common/components/ControlOption'
import FatToggle from '@common/components/FatToggle'
import useBiometrics from '@common/hooks/useBiometrics'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'

const BiometricsOption = () => {
  const { t } = useTranslation()
  const { selectedThemeType } = useTheme()
  const { isEnrolled, saveBiometricsSecret, removeBiometricsSecret } = useBiometrics()

  const {
    state: { hasBiometricsSecret, statuses },
    dispatch: keystoreDispatch
  } = useController('KeystoreController')

  if (!isEnrolled) return null

  useEffect(() => {
    if (statuses.removeSecret === 'SUCCESS') removeBiometricsSecret().catch(() => {})
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
          args: ['biometrics', secret, '', true]
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
