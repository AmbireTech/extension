import React from 'react'
import { View } from 'react-native'

import useNavigation from '@common/hooks/useNavigation'
import HeaderBackButton from '@common/modules/header/components/HeaderBackButton'
import { ROUTES } from '@common/modules/router/constants/common'
import TermsComponent from '@common/modules/terms/components'
import spacings from '@common/styles/spacings'
import SettingsPageHeader from '@web/modules/settings/components/SettingsPageHeader'

const TermsSettingsScreen = () => {
  const { navigate } = useNavigation()

  const goBack = () => {
    navigate(ROUTES.settingsAbout)
  }

  return (
    <>
      <View style={spacings.mb}>
        <HeaderBackButton forceBack onGoBackPress={goBack} />
      </View>
      <SettingsPageHeader title="Terms of Service" />
      <TermsComponent />
    </>
  )
}

export default React.memo(TermsSettingsScreen)
