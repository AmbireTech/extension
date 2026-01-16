import React from 'react'

import Button from '@common/components/Button'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import Header from '@common/modules/header/components/Header'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { TabLayoutContainer } from '@web/components/TabLayoutWrapper'
import NetworkSettings from '@web/modules/network-settings/components'
import SettingsPageHeader from '@web/modules/settings/components/SettingsPageHeader'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import getStyles from './styles'

const NetworksConfiguration = () => {
  const { styles, theme } = useTheme(getStyles)
  const { t } = useTranslation()
  const { navigate } = useNavigation()

  return (
    <TabLayoutContainer
      backgroundColor={theme.secondaryBackground}
      header={<Header mode="title" withAmbireLogo />}
    >
      <View style={[styles.contentContainer]}>
        <SettingsPageHeader
          title={t('Networks Configuration')}
          // @ts-ignore
          style={[spacings.mt0, spacings.mbSm]}
        />
        <NetworkSettings />
        <View style={[spacings.mt, flexbox.directionRow, flexbox.alignSelfEnd]}>
          <Button
            type="primary"
            size="small"
            hasBottomSpacing={false}
            onPress={() => navigate(ROUTES.getStarted)}
            text={t('Confirm')}
          />
        </View>
      </View>
    </TabLayoutContainer>
  )
}

export default React.memo(NetworksConfiguration)
