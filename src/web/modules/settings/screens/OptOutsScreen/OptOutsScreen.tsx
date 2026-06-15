import React, { useContext, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import SearchIcon from '@common/assets/svg/SearchIcon'
import CrashAnalyticsControlOption from '@common/modules/settings/components/General/CrashAnalyticsControlOption'
import spacings from '@common/styles/spacings'
import SettingsPageHeader from '@web/modules/settings/components/SettingsPageHeader'
import { SettingsRoutesContext } from '@web/modules/settings/contexts/SettingsRoutesContext'

import OptOutControlOption from './components/OptOutControlOption'

const OptOutsScreen = () => {
  const { setCurrentSettingsPage } = useContext(SettingsRoutesContext)
  const { t } = useTranslation()

  useEffect(() => {
    setCurrentSettingsPage('opt-outs')
  }, [setCurrentSettingsPage])

  return (
    <>
      <SettingsPageHeader title="Privacy opt outs" />
      <View style={spacings.mb2Xl}>
        <OptOutControlOption
          title={t('Tokens, NFTs & DeFi positions auto discovery')}
          description={t('Fetch tokens and positions via Ambire API, using third party providers')}
          icon={<SearchIcon width={24} height={24} />}
          flag="tokenAndDefiAutoDiscovery"
        />
        <OptOutControlOption
          title={t('Transaction arguments decoding')}
          description={t(
            `Use Ambire's API to decode transaction arguments and show action names when signing calls`
          )}
          icon={<SearchIcon width={24} height={24} />}
          flag="apiForFunctionSelectors"
        />
        <CrashAnalyticsControlOption />
      </View>
    </>
  )
}

export default OptOutsScreen
