import React from 'react'
import { View } from 'react-native'

import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import CreateAccountForm from '@common/modules/auth/components/CreateAccountForm'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import {
  AuthLayoutWrapperMainContent,
  AuthLayoutWrapperSideContent
} from '@web/components/AuthLayoutWrapper/AuthLayoutWrapper'
import styles from '@web/components/AuthLayoutWrapper/styles'

const EmailRegisterScreen = () => {
  const { t } = useTranslation()

  return (
    <>
      <AuthLayoutWrapperMainContent>
        <View style={styles.mainContentWrapper}>
          <CreateAccountForm />
        </View>
      </AuthLayoutWrapperMainContent>
      <AuthLayoutWrapperSideContent backgroundType="beta">
        <Text weight="regular" fontSize={16} style={spacings.mb} color={colors.titan}>
          {t(
            'Quickly set up a secure Ambire wallet using your email to enjoy seamless crypto self-custody and management.'
          )}
        </Text>
      </AuthLayoutWrapperSideContent>
    </>
  )
}

export default EmailRegisterScreen
