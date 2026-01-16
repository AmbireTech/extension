import React from 'react'

import useTheme from '@common/hooks/useTheme'
import Header from '@common/modules/header/components/Header'
import spacings from '@common/styles/spacings'
import { TabLayoutContainer } from '@web/components/TabLayoutWrapper'
import NetworkSettings from '@web/modules/network-settings/components'
import SettingsPageHeader from '@web/modules/settings/components/SettingsPageHeader'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import getStyles from './styles'

const NetworksConfiguration = () => {
  const { styles, theme } = useTheme(getStyles)
  const { t } = useTranslation()

  return (
    <TabLayoutContainer
      backgroundColor={theme.secondaryBackground}
      header={<Header mode="title" withAmbireLogo />}
    >
      <View style={[styles.contentContainer]}>
        <SettingsPageHeader title={t('Networks Configuration')} style={spacings.mt0} />
        <NetworkSettings />
      </View>
    </TabLayoutContainer>
  )
}

export default React.memo(NetworksConfiguration)
