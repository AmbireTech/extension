import React from 'react'
import { View } from 'react-native'

import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import { ROUTES } from '@common/modules/router/constants/common'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import {
  AuthLayoutWrapperMainContent,
  AuthLayoutWrapperSideContent
} from '@web/components/AuthLayoutWrapper/AuthLayoutWrapper'
import Card from '@web/modules/auth/components/Card'

const EmailAccountScreen = () => {
  const { t } = useTranslation()
  const { navigate } = useNavigation()

  return (
    <>
      <AuthLayoutWrapperMainContent>
        <View style={[flexbox.directionRow, flexbox.justifyCenter]}>
          <Card
            text={t(
              'Sign in to your Ambire wallet using your email for a simple and secure access to your crypto.'
            )}
            style={spacings.mr}
          >
            <Button
              hasBottomSpacing={false}
              text={t('Log In')}
              onPress={() => navigate(ROUTES.authEmailLogin)}
            />
          </Card>
          <Card
            text={t(
              'Create a new Ambire wallet with just your email and start managing your crypto.'
            )}
            style={spacings.ml}
          >
            <Button
              hasBottomSpacing={false}
              text={t('Create New')}
              onPress={() => navigate(ROUTES.authEmailRegister)}
            />
          </Card>
        </View>
      </AuthLayoutWrapperMainContent>
      <AuthLayoutWrapperSideContent backgroundType="beta">
        <Text weight="regular" fontSize={16} style={spacings.mb} color={colors.titan}>
          {t(
            "Explore Ambire's powerful and user-friendly wallet options by logging in with your existing account or registering a new one via email. Both options provide secure access to your crypto assets while making self-custody and management simple and intuitive."
          )}
        </Text>
        <Text weight="regular" fontSize={16} color={colors.titan}>
          {t(
            'Get started with Ambire today and enjoy a seamless experience tailored to your needs.'
          )}
        </Text>
      </AuthLayoutWrapperSideContent>
    </>
  )
}

export default EmailAccountScreen
