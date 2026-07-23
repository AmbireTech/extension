import React, { useContext, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import EnsIcon from '@common/assets/svg/EnsIcon'
import LightningIcon from '@common/assets/svg/LightningIcon'
import useTheme from '@common/hooks/useTheme'
import CrashAnalyticsControlOption from '@common/modules/settings/components/General/CrashAnalyticsControlOption'
import AmbireApiOptions from '@common/modules/settings/components/PrivacyOptOuts/AmbireApiOptions'
import OptOutControlOption from '@common/modules/settings/components/PrivacyOptOuts/OptOutControlOption'
import spacings from '@common/styles/spacings'
import SettingsPageHeader from '@web/modules/settings/components/SettingsPageHeader'
import { SettingsRoutesContext } from '@web/modules/settings/contexts/SettingsRoutesContext'

const OptOutsScreen = () => {
  const { setCurrentSettingsPage } = useContext(SettingsRoutesContext)
  const { theme } = useTheme()
  const { t } = useTranslation()

  useEffect(() => {
    setCurrentSettingsPage('opt-outs')
  }, [setCurrentSettingsPage])

  return (
    <>
      <SettingsPageHeader title="Privacy opt outs" />
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
    </>
  )
}

export default OptOutsScreen
