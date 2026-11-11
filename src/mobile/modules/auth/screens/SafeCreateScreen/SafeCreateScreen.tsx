import React from 'react'
import { Keyboard, Pressable, View } from 'react-native'

import SafeCreateContent from '@common/modules/auth/components/SafeCreateContent'
import SafeCreateFooterButton from '@common/modules/auth/components/SafeCreateFooterButton'
import useSafeCreate from '@common/modules/auth/hooks/useSafeCreate'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'

const SafeCreateScreen = () => {
  const safeCreate = useSafeCreate()

  return (
    <MobileLayoutContainer
      footer={
        <View style={spacings.ptSm}>
          <SafeCreateFooterButton safeCreate={safeCreate} />
        </View>
      }
    >
      <MobileLayoutWrapperMainContent
        withBackButton
        onBackButtonPress={safeCreate.handleBackPress}
        title={safeCreate.title}
      >
        {/* Tapping anywhere outside the input (or another touchable) hides the keyboard */}
        <Pressable style={flexbox.flex1} onPress={Keyboard.dismiss}>
          <SafeCreateContent safeCreate={safeCreate} />
        </Pressable>
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default React.memo(SafeCreateScreen)
