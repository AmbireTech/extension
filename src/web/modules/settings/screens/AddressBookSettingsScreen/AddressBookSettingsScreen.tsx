import React, { useContext, useEffect } from 'react'
import { View } from 'react-native'

import flexbox from '@common/styles/utils/flexbox'
import { SettingsRoutesContext } from '@web/modules/settings/contexts/SettingsRoutesContext'

import ContactsList from './components/ContactsList'

const AddressBookSettingsScreen = () => {
  const { setCurrentSettingsPage } = useContext(SettingsRoutesContext)

  useEffect(() => {
    setCurrentSettingsPage('address-book')
  }, [setCurrentSettingsPage])

  return (
    <View style={[flexbox.flex1]}>
      <ContactsList />
    </View>
  )
}

export default React.memo(AddressBookSettingsScreen)
