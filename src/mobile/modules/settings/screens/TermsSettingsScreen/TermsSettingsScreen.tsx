import React from 'react'

import TermsComponent from '@common/modules/terms/components'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'

const TermsSettingsScreen = () => {
  return (
    <MobileLayoutContainer>
      <MobileLayoutWrapperMainContent withScroll withBackButton title="Terms of Service">
        <TermsComponent />
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default React.memo(TermsSettingsScreen)
