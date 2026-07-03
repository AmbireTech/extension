import React from 'react'
import { useTranslation } from 'react-i18next'

import GasTankContent from '@common/modules/gas-tank/components/GasTankContent'
import { HeaderWithTitle } from '@common/modules/header/components/Header/Header'
import { TabLayoutContainer, TabLayoutWrapperMainContent } from '@web/components/TabLayoutWrapper'

const GasTankScreen = () => {
  const { t } = useTranslation()

  return (
    <TabLayoutContainer
      width="full"
      header={
        <HeaderWithTitle
          title={t('Gas tank for Safe accounts')}
          displayBackButtonIn="always"
          width="xl"
        />
      }
    >
      <TabLayoutWrapperMainContent>
        <GasTankContent />
      </TabLayoutWrapperMainContent>
    </TabLayoutContainer>
  )
}

export default React.memo(GasTankScreen)
