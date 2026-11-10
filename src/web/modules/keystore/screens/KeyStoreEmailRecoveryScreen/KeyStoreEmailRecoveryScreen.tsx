import React, { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import Panel from '@common/components/Panel'
import useController from '@common/hooks/useController'
import useNavigation from '@common/hooks/useNavigation'
import usePrevious from '@common/hooks/usePrevious'
import useTheme from '@common/hooks/useTheme'
import { HeaderWithLogoOnly } from '@common/modules/header/components/Header/Header'
import { ROUTES } from '@common/modules/router/constants/common'
import { selectIsEmailVaultEnabled } from '@common/selectors/featureFlags'
import {
  TabLayoutContainer,
  TabLayoutWrapperMainContent
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import EmailForm from '@web/modules/keystore/components/EmailForm'
import EmailVaultDisabledAlert from '@web/modules/keystore/components/EmailVaultDisabledAlert'

const KeyStoreEmailRecoveryScreen = () => {
  const { t } = useTranslation()

  const { theme } = useTheme()
  const { navigate } = useNavigation()
  const emailVault = useController('EmailVaultController').state
  const { state: isEmailVaultEnabled } = useController(
    'FeatureFlagsController',
    selectIsEmailVaultEnabled
  )
  const prevHasConfirmedRecoveryEmail = usePrevious(emailVault.hasConfirmedRecoveryEmail)

  useEffect(() => {
    if (!prevHasConfirmedRecoveryEmail && emailVault.hasConfirmedRecoveryEmail) {
      navigate(ROUTES.keyStoreEmailRecoverySetNewPassword)
    }
  }, [emailVault.hasConfirmedRecoveryEmail, navigate, prevHasConfirmedRecoveryEmail])

  const handleBackButtonPress = useCallback(() => {
    navigate(ROUTES.keyStoreUnlock)
  }, [navigate])

  return (
    <TabLayoutContainer backgroundColor={theme.secondaryBackground} header={<HeaderWithLogoOnly />}>
      <TabLayoutWrapperMainContent withScroll={false}>
        <Panel
          type="onboarding"
          title={t('Restore extension password')}
          spacingsSize="small"
          withBackButton
          onBackButtonPress={handleBackButtonPress}
          step={1}
          totalSteps={2}
        >
          {isEmailVaultEnabled ? <EmailForm /> : <EmailVaultDisabledAlert />}
        </Panel>
      </TabLayoutWrapperMainContent>
    </TabLayoutContainer>
  )
}

export default React.memo(KeyStoreEmailRecoveryScreen)
