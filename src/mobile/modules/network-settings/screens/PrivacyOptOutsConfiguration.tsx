import React from 'react'
import { useTranslation } from 'react-i18next'

import Button from '@common/components/Button'
import useNavigation from '@common/hooks/useNavigation'
import { ROUTES } from '@common/modules/router/constants/common'
import PrivacyOptOutsList from '@common/modules/settings/components/PrivacyOptOuts/PrivacyOptOutsList'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'

const PrivacyOptOutsConfiguration = () => {
  const { t } = useTranslation()
  const { navigate } = useNavigation()

  return (
    <MobileLayoutContainer
      footer={
        <Button
          type="primary"
          style={{ minWidth: 220 }}
          hasBottomSpacing={false}
          onPress={() => navigate(ROUTES.getStarted)}
          text={t('Confirm and go back')}
        />
      }
    >
      <MobileLayoutWrapperMainContent withBackButton title="Privacy Opt-outs">
        <PrivacyOptOutsList />
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default React.memo(PrivacyOptOutsConfiguration)
