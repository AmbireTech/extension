import React from 'react'

import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import PrivateKeyForm from '@common/modules/auth/components/PrivateKeyForm'
import RecoveryPhraseForm from '@common/modules/auth/components/RecoveryPhraseForm'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import text from '@common/styles/utils/text'
import {
  AuthLayoutWrapperMainContent,
  AuthLayoutWrapperSideContent
} from '@web/components/AuthLayoutWrapper/AuthLayoutWrapper'

const ExternalSignerLoginScreen = () => {
  const { t } = useTranslation()

  return (
    <>
      <AuthLayoutWrapperMainContent>
        <PrivateKeyForm />
        <Text style={[spacings.mvLg, text.center]}>or</Text>
        <RecoveryPhraseForm />
      </AuthLayoutWrapperMainContent>
      <AuthLayoutWrapperSideContent backgroundType="beta">
        <Text
          shouldScale={false}
          weight="regular"
          fontSize={20}
          style={spacings.mb}
          color={colors.titan}
        >
          {t('Import Legacy Account')}
        </Text>
        <Text color={colors.titan}>
          {t(
            'Bring your existing crypto account on board by providing a private key or passphrase.'
          )}
        </Text>
      </AuthLayoutWrapperSideContent>
    </>
  )
}

export default ExternalSignerLoginScreen
