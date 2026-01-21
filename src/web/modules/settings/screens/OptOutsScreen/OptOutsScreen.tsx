import React, { useContext, useEffect } from 'react'
import { View } from 'react-native'

import spacings from '@common/styles/spacings'
import SettingsPageHeader from '@web/modules/settings/components/SettingsPageHeader'
import { SettingsRoutesContext } from '@web/modules/settings/contexts/SettingsRoutesContext'

import DefiPositionsControlOption from '../GeneralSettingsScreen/components/DefiPositionsControlOption'

const OptOutsScreen = () => {
  const { setCurrentSettingsPage } = useContext(SettingsRoutesContext)

  useEffect(() => {
    setCurrentSettingsPage('opt-outs')
  }, [setCurrentSettingsPage])

  return (
    <>
      <SettingsPageHeader title="Privacy opt outs" />
      <View style={spacings.mb2Xl}>
        <DefiPositionsControlOption />
      </View>
    </>
  )
}

export default OptOutsScreen
