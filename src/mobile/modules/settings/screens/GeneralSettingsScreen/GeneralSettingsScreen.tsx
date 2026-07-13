import React from 'react'

import AvatarTypeControlOption from '@common/modules/settings/components/General/AvatarTypeControlOption'
import ThemeControlOption from '@common/modules/settings/components/General/ThemeControlOption'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'
import BiometricsOption from '@mobile/modules/settings/components/General/BiometricsOption'

const GeneralSettingsScreen = () => {
  return (
    <MobileLayoutContainer>
      <MobileLayoutWrapperMainContent withScroll withBackButton title="General">
        <BiometricsOption />
        <ThemeControlOption />
        <AvatarTypeControlOption />
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default GeneralSettingsScreen
