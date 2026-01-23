import React, { useContext, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import HelpIcon from '@common/assets/svg/HelpIcon'
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
          description={t(
            'Should we fetch your tokens and defi positions via our own API that uses third party providers.'
          )}
          icon={<HelpIcon color={theme.primaryText} />}
          flag="tokenAndDefiAutoDiscovery"
        />
      </View>
    </>
  )
}

export default OptOutsScreen
