import React, { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import Panel from '@common/components/Panel'
import useNavigation from '@common/hooks/useNavigation'
import usePrevious from '@common/hooks/usePrevious'
import useTheme from '@common/hooks/useTheme'
import Header from '@common/modules/header/components/Header'
import { ROUTES } from '@common/modules/router/constants/common'
import {
  TabLayoutContainer,
  TabLayoutWrapperMainContent
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import useEmailVaultControllerState from '@web/hooks/useEmailVaultControllerState'
import EmailForm from '@web/modules/keystore/components/EmailForm'

const KeyStoreEmailRecoveryScreen = () => {
  const { t } = useTranslation()

  const { theme } = useTheme()
  const { navigate } = useNavigation()
  const emailVault = useEmailVaultControllerState()
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
    <TabLayoutContainer
      backgroundColor={theme.secondaryBackground}
      header={<Header mode="custom-inner-content" withAmbireLogo />}
    >
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
          <EmailForm />
        </Panel>
      </TabLayoutWrapperMainContent>
    </TabLayoutContainer>
  )
}

export default React.memo(KeyStoreEmailRecoveryScreen)
