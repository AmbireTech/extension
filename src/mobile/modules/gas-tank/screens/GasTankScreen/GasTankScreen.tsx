import React from 'react'
import { useTranslation } from 'react-i18next'

import GasTankContent from '@common/modules/gas-tank/components/GasTankContent'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'

const GasTankScreen = () => {
  const { t } = useTranslation()

  return (
    <MobileLayoutContainer>
      <MobileLayoutWrapperMainContent
        withScroll
        withBackButton
        title={t('Gas tank for Safe accounts')}
      >
        <GasTankContent />
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default React.memo(GasTankScreen)
