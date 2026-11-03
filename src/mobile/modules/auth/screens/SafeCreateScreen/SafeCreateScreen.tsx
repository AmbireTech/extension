import React from 'react'
import { Keyboard, Pressable, View } from 'react-native'

import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import SafeCreateForm from '@common/modules/auth/components/SafeCreateForm'
import useSafeCreate from '@common/modules/auth/hooks/useSafeCreate'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'

const SafeCreateScreen = () => {
  const { goToPrevRoute, isCreateButtonDisabled, handleCreate, ...formProps } = useSafeCreate()
  const { t } = useTranslation()

  return (
    <MobileLayoutContainer
      footer={
        <View style={spacings.ptSm}>
          <Button
            testID="safe-create-button"
            size="large"
            text={t('Create Multisig')}
            hasBottomSpacing={false}
            onPress={handleCreate}
            disabled={isCreateButtonDisabled}
          />
        </View>
      }
    >
      <MobileLayoutWrapperMainContent
        withBackButton
        onBackButtonPress={goToPrevRoute}
        title={t('Create Safe account')}
      >
        {/* Tapping anywhere outside the input (or another touchable) hides the keyboard */}
        <Pressable style={flexbox.flex1} onPress={Keyboard.dismiss}>
          <Text fontSize={14} appearance="secondaryText" style={spacings.mbTy}>
            {t('Choose owners and required confirmations')}
          </Text>
          <SafeCreateForm {...formProps} />
        </Pressable>
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default React.memo(SafeCreateScreen)
