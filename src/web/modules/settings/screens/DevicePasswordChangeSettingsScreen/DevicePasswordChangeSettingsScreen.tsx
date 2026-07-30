import React, { useContext, useEffect } from 'react'

import Button from '@common/components/Button'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import ChangeKeystorePassword from '@common/modules/settings/components/ChangeKeystorePassword'
import useChangeKeystorePassword from '@common/modules/settings/hooks/useChangeKeystorePassword'
import { SPACING_XL } from '@common/styles/spacings'
import { SettingsRoutesContext } from '@web/modules/settings/contexts/SettingsRoutesContext'

const DevicePasswordChangeSettingsScreen = () => {
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const { setCurrentSettingsPage } = useContext(SettingsRoutesContext)
  const form = useChangeKeystorePassword()

  // If Keystore password is not set yet, it is not possible to change it.
  // Because of this, if the user tries to load Settings -> Change password route,
  // we will redirect it to the route, where he can set its password for first time.
  useEffect(() => {
    if (!form.hasPasswordSecret) navigate(WEB_ROUTES.devicePasswordSet)
  }, [form.hasPasswordSecret, navigate])

  useEffect(() => {
    setCurrentSettingsPage('device-password-change')
  }, [setCurrentSettingsPage])

  return (
    <ChangeKeystorePassword
      form={form}
      title={t('Change extension password')}
      successModalTitle={t('Extension password')}
      successText={t('Your extension password was successfully changed!')}
      submitButton={
        <Button
          testID="change-device-pass-button"
          style={{ alignSelf: 'flex-start', paddingHorizontal: SPACING_XL }}
          hasBottomSpacing={false}
          // !== 'INITIAL' to prevent calling same func while the prev execution of that func sends it's status to the FE
          disabled={form.status !== 'INITIAL' || !form.isValid}
          text={form.status === 'LOADING' ? t('Loading...') : t('Change extension password')}
          onPress={form.handleChangeKeystorePassword}
        />
      }
    />
  )
}

export default React.memo(DevicePasswordChangeSettingsScreen)
