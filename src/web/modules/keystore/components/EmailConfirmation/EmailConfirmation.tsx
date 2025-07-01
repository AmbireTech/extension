import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import Text from '@common/components/Text'
import EmailAnimation from '@common/modules/auth/components/EmailAnimation'

import styles from './styles'

interface Props {
  email: string
  handleCancelLoginAttempt: () => void
}

const EmailConfirmation: FC<Props> = ({ email, handleCancelLoginAttempt }) => {
  const { t } = useTranslation()

  return (
    <>
      <View style={styles.animation}>
        <EmailAnimation />
      </View>
      <Text fontSize={14} weight="regular" style={styles.sentEmailText}>
        {t('We sent an email to {{email}}, please check your inbox and click Verify.', { email })}
      </Text>
      <Text fontSize={14} style={styles.waitingEmailConfirmationText} appearance="primary">
        {t('Waiting for Email Confirmation')}
      </Text>

      <Text
        underline
        fontSize={14}
        style={styles.cancelLoginAttemptText}
        onPress={handleCancelLoginAttempt}
      >
        {t('Cancel')}
      </Text>
    </>
  )
}

export default EmailConfirmation
