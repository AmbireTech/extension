import React, { useContext, useEffect } from 'react'

import PrivacyOptOutsList from '@common/modules/settings/components/PrivacyOptOuts/PrivacyOptOutsList'
import SettingsPageHeader from '@web/modules/settings/components/SettingsPageHeader'
import { SettingsRoutesContext } from '@web/modules/settings/contexts/SettingsRoutesContext'

const OptOutsScreen = () => {
  const { setCurrentSettingsPage } = useContext(SettingsRoutesContext)

  useEffect(() => {
    setCurrentSettingsPage('opt-outs')
  }, [setCurrentSettingsPage])

  return (
    <>
      <SettingsPageHeader title="Privacy opt outs" />
      <PrivacyOptOutsList />
    </>
  )
}

export default OptOutsScreen
