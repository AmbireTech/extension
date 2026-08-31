import React from 'react'

import { useTranslation } from '@common/config/localization'
import PrivacyOptOutsList from '@common/modules/settings/components/PrivacyOptOuts/PrivacyOptOutsList'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'

const PrivacyOptOutsSettingsScreen = () => {
  const { t } = useTranslation()

  return (
    <MobileLayoutContainer>
      <MobileLayoutWrapperMainContent withScroll withBackButton title={t('Privacy opt-outs')}>
        <PrivacyOptOutsList />
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default React.memo(PrivacyOptOutsSettingsScreen)
