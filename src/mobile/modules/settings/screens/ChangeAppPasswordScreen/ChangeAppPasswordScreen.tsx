import React from 'react'

import Button from '@common/components/Button'
import { useTranslation } from '@common/config/localization'
import ChangeKeystorePassword from '@common/modules/settings/components/ChangeKeystorePassword'
import useChangeKeystorePassword from '@common/modules/settings/hooks/useChangeKeystorePassword'
import flexbox from '@common/styles/utils/flexbox'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'

const ChangeAppPasswordScreen = () => {
  const { t } = useTranslation()
  const form = useChangeKeystorePassword()

  return (
    <MobileLayoutContainer
      footer={
        <Button
          testID="change-device-pass-button"
          size="regular"
          hasBottomSpacing={false}
          // !== 'INITIAL' to prevent calling same func while the prev execution of that func sends it's status to the FE
          disabled={form.status !== 'INITIAL' || !form.isValid}
          text={form.status === 'LOADING' ? t('Loading...') : t('Change app password')}
          onPress={form.handleChangeKeystorePassword}
          style={{ ...flexbox.alignSelfCenter, width: '100%' }}
        />
      }
    >
      <MobileLayoutWrapperMainContent withScroll withBackButton title={t('Change app password')}>
        <ChangeKeystorePassword
          form={form}
          successModalTitle={t('App password')}
          successText={t('Your app password was successfully changed!')}
        />
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default React.memo(ChangeAppPasswordScreen)
