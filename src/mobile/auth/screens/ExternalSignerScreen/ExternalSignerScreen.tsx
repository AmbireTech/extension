import React, { useLayoutEffect, useState } from 'react'
import { Keyboard, LayoutAnimation, TouchableWithoutFeedback, View } from 'react-native'

import GradientBackgroundWrapper from '@common/components/GradientBackgroundWrapper'
import Segments from '@common/components/Segments'
import Wrapper, { WRAPPER_TYPES } from '@common/components/Wrapper'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import { triggerLayoutAnimation } from '@common/services/layoutAnimation'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import AmbireLogo from '@mobile/auth/components/AmbireLogo'
import PrivateKeyForm from '@mobile/auth/components/PrivateKeyForm'
import RecoveryPhraseForm from '@mobile/auth/components/RecoveryPhraseForm'

// eslint-disable-next-line @typescript-eslint/naming-convention
export enum FORM_TYPE {
  PRIVATE_KEY = 'Private Key',
  RECOVERY_PHRASE = 'Recovery Phrase'
}

const segments = [{ value: FORM_TYPE.PRIVATE_KEY }, { value: FORM_TYPE.RECOVERY_PHRASE }]

const ExternalSignerScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation()
  const [formType, setFormType] = useState<FORM_TYPE>(FORM_TYPE.PRIVATE_KEY)

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle:
        formType === FORM_TYPE.RECOVERY_PHRASE
          ? t('Login with Recovery Phrase')
          : t('Login with Private Key')
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
          <AmbireLogo shouldExpand={false} />
          <View style={[spacings.mbLg, spacings.ph]}>
            <Segments
              defaultValue={formType}
              segments={segments}
              onChange={(value: FORM_TYPE) => {
                setFormType(value)
                triggerLayoutAnimation({
                  forceAnimate: true,
                  config: LayoutAnimation.create(300, 'linear', 'opacity')
                })
              }}
              fontSize={14}
            />
          </View>
          <View style={[flexboxStyles.flex1, flexboxStyles.justifyEnd]}>
            {formType === FORM_TYPE.PRIVATE_KEY && <PrivateKeyForm />}
            {formType === FORM_TYPE.RECOVERY_PHRASE && <RecoveryPhraseForm />}
          </View>
        </Wrapper>
      </TouchableWithoutFeedback>
    </GradientBackgroundWrapper>
  )
}

export default ExternalSignerScreen
