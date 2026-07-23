import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import EnsIcon from '@common/assets/svg/EnsIcon'
import LightningIcon from '@common/assets/svg/LightningIcon'
import Button from '@common/components/Button'
import { PanelBackButton } from '@common/components/Panel/Panel'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import { ROUTES } from '@common/modules/router/constants/common'
import CrashAnalyticsControlOption from '@common/modules/settings/components/General/CrashAnalyticsControlOption'
import AmbireApiOptions from '@common/modules/settings/components/PrivacyOptOuts/AmbireApiOptions'
import OptOutControlOption from '@common/modules/settings/components/PrivacyOptOuts/OptOutControlOption'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { TabLayoutContainer } from '@web/components/TabLayoutWrapper'
import SettingsPageHeader from '@web/modules/settings/components/SettingsPageHeader'

import getStyles from './styles'

const PrivacyOptOutsConfiguration = () => {
  const { styles, theme } = useTheme(getStyles)
  const { t } = useTranslation()
  const { navigate } = useNavigation()

  return (
    <TabLayoutContainer backgroundColor={theme.secondaryBackground}>
      <View
        style={[
          styles.privacyOptOutsContentContainer,
          flexbox.alignSelfCenter,
          spacings.pbSLg,
          { maxWidth: 568 }
        ]}
      >
        <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mbSm]}>
          <PanelBackButton onPress={() => navigate(ROUTES.getStarted)} style={spacings.mrTy} />
          <SettingsPageHeader title={t('Privacy Opt-outs configuration')} style={spacings.mb0} />
        </View>
        <View style={spacings.mb2Xl}>
          <AmbireApiOptions />
          <OptOutControlOption
            title={t('ERC-4337 smart account features')}
            description={t(
              'Use bundlers and paymasters for smart account gas estimation, gas tank, sponsored gas, and token fee payments.'
            )}
            icon={<LightningIcon width={24} height={24} color={theme.iconPrimary} />}
            flag="erc4337"
          />
          <OptOutControlOption
            title={t('Keep ENS profiles up to date')}
            description={t(
              'Automatically update ENS names and avatars in the background. This improves freshness, but may reduce privacy by linking your accounts together.'
            )}
            icon={<EnsIcon width={20} height={20} color={theme.iconPrimary} />}
            flag="keepEnsProfilesUpToDate"
          />
          <CrashAnalyticsControlOption />
        </View>
        <View style={[flexbox.directionRow, flexbox.alignSelfEnd]}>
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
