import React from 'react'

import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import PrivateKeyForm from '@common/modules/auth/components/PrivateKeyForm'
import RecoveryPhraseForm from '@common/modules/auth/components/RecoveryPhraseForm'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
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
        <PrivateKeyForm themeType={THEME_TYPES.LIGHT} />
        <Text themeType={THEME_TYPES.LIGHT} style={[spacings.mvLg, text.center]}>
          or
        </Text>
        <RecoveryPhraseForm themeType={THEME_TYPES.LIGHT} />
      </AuthLayoutWrapperMainContent>
      <AuthLayoutWrapperSideContent backgroundType="beta">
        <Text shouldScale={false} weight="regular" fontSize={20} style={spacings.mb}>
          {t('Import Legacy Account')}
        </Text>
        <Text shouldScale={false} weight="regular" fontSize={16}>
          {t('Import Legacy Account')}
        </Text>
        <Text>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis ultrices, justo a vulputate
          auctor, est leo egestas nisl, et egestas leo elit et sem. Sed mattis ipsum a ultricies
          porta. Donec efficitur lorem sed scelerisque imperdiet.
        </Text>
      </AuthLayoutWrapperSideContent>
    </>
  )
}

export default ExternalSignerLoginScreen
