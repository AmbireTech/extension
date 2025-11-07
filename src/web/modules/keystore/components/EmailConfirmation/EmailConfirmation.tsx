import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import Button from '@common/components/Button'
import { PanelTitle } from '@common/components/Panel/Panel'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import EmailAnimation from '@common/modules/auth/components/EmailAnimation'
import spacings, { SPACING_LG } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

interface Props {
  email: string
  handleCancelLoginAttempt: () => void
}

const EmailConfirmation: FC<Props> = ({ email, handleCancelLoginAttempt }) => {
  const { t } = useTranslation()

  return (
    <View style={flexbox.alignCenter}>
      <PanelTitle title={t('Email confirmation required')} style={spacings.mbLg} />
      <EmailAnimation width={120} height={120} style={{ marginBottom: SPACING_LG }} />
      <Text fontSize={16} appearance="secondaryText" style={[text.center, spacings.mbXl]}>
        {t('We sent an email to {{email}}, please check your inbox and click Verify.', { email })}
      </Text>
      <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mb2Xl]}>
        <Text fontSize={14} appearance="primary" style={[text.center, spacings.mrTy]}>
          {t('Waiting for email confirmation')}
        </Text>
        <Spinner style={{ width: 16, height: 16 }} />
      </View>

      <Button type="ghost2" text={t('Cancel')} onPress={handleCancelLoginAttempt} />
    </View>
  )
}

export default React.memo(EmailConfirmation)
