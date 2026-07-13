import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import Button from '@common/components/Button'
import { PanelBackButton } from '@common/components/Panel/Panel'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { TabLayoutContainer } from '@web/components/TabLayoutWrapper'
import NetworkSettings from '@web/modules/network-settings/components'
import SettingsPageHeader from '@web/modules/settings/components/SettingsPageHeader'

import getStyles from './styles'

const NetworksConfiguration = () => {
  const { styles, theme } = useTheme(getStyles)
  const { t } = useTranslation()
  const { navigate } = useNavigation()

  return (
    <TabLayoutContainer backgroundColor={theme.secondaryBackground} style={spacings.pt3Xl}>
      <View style={[styles.contentContainer]}>
        <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mbSm]}>
          <PanelBackButton onPress={() => navigate(ROUTES.getStarted)} style={spacings.mrTy} />
          <SettingsPageHeader
            title={t('Network and RPC configuration')}
            style={{ ...spacings.mt0, ...spacings.mb0 }}
          />
        </View>
        <NetworkSettings />
        <View style={[spacings.mt, flexbox.directionRow, flexbox.alignSelfEnd]}>
          <Button
            type="primary"
            style={{ minWidth: 220 }}
            hasBottomSpacing={false}
            onPress={() => navigate(ROUTES.getStarted)}
            text={t('Confirm and go back')}
          />
        </View>
      </View>
    </TabLayoutContainer>
  )
}

export default React.memo(NetworksConfiguration)
