import React, { useContext, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import DiscoveryIcon from '@common/assets/svg/DiscoveryIcon'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import SettingsPageHeader from '@web/modules/settings/components/SettingsPageHeader'
import { SettingsRoutesContext } from '@web/modules/settings/contexts/SettingsRoutesContext'

import OptOutControlOption from './components/OptOutControlOption'

const OptOutsScreen = () => {
  const { setCurrentSettingsPage } = useContext(SettingsRoutesContext)
  const { t } = useTranslation()
  const { theme } = useTheme()

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
          icon={<DiscoveryIcon color={theme.primaryText} width={24} height={24} />}
          flag="tokenAndDefiAutoDiscovery"
        />
      </View>
    </>
  )
}

export default OptOutsScreen
