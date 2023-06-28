import React, { useLayoutEffect, useState } from 'react'
import { Keyboard, LayoutAnimation, TouchableWithoutFeedback, View } from 'react-native'

import GradientBackgroundWrapper from '@common/components/GradientBackgroundWrapper'
import Segments from '@common/components/Segments'
import Text from '@common/components/Text'
import Wrapper, { WRAPPER_TYPES } from '@common/components/Wrapper'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import AmbireLogo from '@common/modules/auth/components/AmbireLogo'
import CreateAccountForm from '@common/modules/auth/components/CreateAccountForm'
import EmailLoginForm from '@common/modules/auth/components/EmailLoginForm'
import { triggerLayoutAnimation } from '@common/services/layoutAnimation'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'

// eslint-disable-next-line @typescript-eslint/naming-convention
export enum FORM_TYPE {
  EMAIL_LOGIN = 'Login with Email',
  CREATE_ACCOUNT = 'Create Account'
}

const segments = [{ value: FORM_TYPE.EMAIL_LOGIN }, { value: FORM_TYPE.CREATE_ACCOUNT }]

const EmailLoginScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation()
  const [formType, setFormType] = useState<FORM_TYPE>(FORM_TYPE.EMAIL_LOGIN)

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: formType === FORM_TYPE.CREATE_ACCOUNT ? t('Create new Account') : t('Login')
    })
  }, [formType, navigation, t])

  return (
    <GradientBackgroundWrapper>
      <TouchableWithoutFeedback
        onPress={() => {
          !isWeb && Keyboard.dismiss()
        }}
      >
        <Wrapper
          contentContainerStyle={spacings.pbLg}
          type={WRAPPER_TYPES.KEYBOARD_AWARE_SCROLL_VIEW}
          extraHeight={220}
        >
          <View style={[flexboxStyles.flex1, flexboxStyles.justifyEnd]}>
            {formType === FORM_TYPE.EMAIL_LOGIN && <EmailLoginForm />}
            {formType === FORM_TYPE.CREATE_ACCOUNT && <CreateAccountForm />}
          </View>
          {formType === FORM_TYPE.CREATE_ACCOUNT && (
            <Text
              onPress={() => {
                setFormType(FORM_TYPE.EMAIL_LOGIN)
                triggerLayoutAnimation({
                  forceAnimate: true,
                  config: LayoutAnimation.create(300, 'linear', 'opacity')
                })
              }}
              style={spacings.mtTy}
            >
              {t('Already have an account? ')}
              <Text underline color={colors.turquoise}>
                {t('Login with Email')}
              </Text>
            </Text>
          )}
          {formType === FORM_TYPE.EMAIL_LOGIN && (
            <Text
              onPress={() => {
                setFormType(FORM_TYPE.CREATE_ACCOUNT)
                triggerLayoutAnimation({
                  forceAnimate: true,
                  config: LayoutAnimation.create(300, 'linear', 'opacity')
                })
              }}
              style={spacings.mtTy}
            >
              {t("Don't have an account? ")}
              <Text underline color={colors.turquoise}>
                {t('Sign Up')}
              </Text>
            </Text>
          )}
        </Wrapper>
      </TouchableWithoutFeedback>
    </GradientBackgroundWrapper>
  )
}

export default EmailLoginScreen
