import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import SearchIcon from '@common/assets/svg/SearchIcon'
import Button from '@common/components/Button'
import { PanelBackButton } from '@common/components/Panel/Panel'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { TabLayoutContainer } from '@web/components/TabLayoutWrapper'
import SettingsPageHeader from '@web/modules/settings/components/SettingsPageHeader'
import OptOutControlOption from '@web/modules/settings/screens/OptOutsScreen/components/OptOutControlOption'

import getStyles from './styles'

const PrivacyOptOutsConfiguration = () => {
  const { styles, theme } = useTheme(getStyles)
  const { t } = useTranslation()
  const { navigate } = useNavigation()

  return (
    <TabLayoutContainer backgroundColor={theme.secondaryBackground} style={spacings.pt3Xl}>
      <View style={styles.contentContainer}>
        <PanelBackButton onPress={() => navigate(ROUTES.getStarted)} style={spacings.mbSm} />
        <SettingsPageHeader
          title={t('Privacy Opt-outs configuration')}
          style={{ ...spacings.mt0, ...spacings.mbSm }}
        />
        <View style={spacings.mb2Xl}>
          <OptOutControlOption
            title={t('Tokens, NFTs & DeFi positions auto discovery')}
            description={t(
              'Fetch tokens and positions via Ambire API, using third party providers'
            )}
            icon={<SearchIcon width={24} height={24} />}
            flag="tokenAndDefiAutoDiscovery"
          />
        </View>
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

export default React.memo(PrivacyOptOutsConfiguration)
