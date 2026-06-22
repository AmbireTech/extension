import React from 'react'
import { useTranslation } from 'react-i18next'

import Button from '@common/components/Button'
import useNavigation from '@common/hooks/useNavigation'
import { ROUTES } from '@common/modules/router/constants/common'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'
import NetworkSettings from '@mobile/modules/network-settings/components'

const NetworksConfiguration = () => {
  const { t } = useTranslation()
  const { navigate } = useNavigation()

  return (
    <MobileLayoutContainer
      footer={
        <Button
          type="primary"
          hasBottomSpacing={false}
          onPress={() => navigate(ROUTES.getStarted)}
          text={t('Confirm and go back')}
        />
      }
    >
      <MobileLayoutWrapperMainContent withBackButton title="Network and RPC configuration">
        <NetworkSettings />
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default React.memo(NetworksConfiguration)
