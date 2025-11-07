import React, { useCallback, useEffect, useState } from 'react'
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
import useBackgroundService from '@web/hooks/useBackgroundService'
import useEmailVaultControllerState from '@web/hooks/useEmailVaultControllerState'
import PinExtension from '@web/modules/auth/components/PinExtension'
import KeyStoreSetNewPasswordForm from '@web/modules/keystore/components/KeyStoreSetNewPasswordForm'

import KeyStoreSetNewPasswordCompleted from '../../components/KeyStoreSetNewPasswordCompleted/KeyStoreSetNewPasswordCompleted'

const KeyStoreEmailRecoverySetNewPasswordScreen = () => {
  const { t } = useTranslation()
  const [passwordResetCompleted, setPasswordResetCompleted] = useState(false)

  const { theme } = useTheme()
  const { navigate } = useNavigation()
  const emailVault = useEmailVaultControllerState()
  const { dispatch } = useBackgroundService()

  const prevRecoverKeyStoreStatus = usePrevious(emailVault.statuses.recoverKeyStore)
  const handleBackButtonPress = useCallback(() => {
    dispatch({ type: 'EMAIL_VAULT_CONTROLLER_CANCEL_CONFIRMATION' })
    navigate(ROUTES.keyStoreEmailRecovery)
  }, [navigate, dispatch])

  useEffect(() => {}, [])

  useEffect(() => {
    if (
      prevRecoverKeyStoreStatus === 'LOADING' &&
      emailVault.statuses.recoverKeyStore === 'SUCCESS'
    ) {
      setPasswordResetCompleted(true)
    }
  }, [emailVault.statuses.recoverKeyStore, prevRecoverKeyStoreStatus])

  return (
    <>
      {!!passwordResetCompleted && <PinExtension />}
      <TabLayoutContainer
        backgroundColor={theme.secondaryBackground}
        header={
          passwordResetCompleted ? (
            <Header customTitle={' '} />
          ) : (
            <Header mode="custom-inner-content" withAmbireLogo />
          )
        }
      >
        <TabLayoutWrapperMainContent withScroll={false}>
          <Panel
            type="onboarding"
            title={
              passwordResetCompleted
                ? t('Password reset completed')
                : t('Restore extension password')
            }
            spacingsSize="small"
            withBackButton={!passwordResetCompleted && !emailVault.hasConfirmedRecoveryEmail}
            onBackButtonPress={handleBackButtonPress}
            step={passwordResetCompleted ? undefined : 2}
            totalSteps={2}
          >
            {passwordResetCompleted && <KeyStoreSetNewPasswordCompleted />}
            {!passwordResetCompleted && <KeyStoreSetNewPasswordForm />}
          </Panel>
        </TabLayoutWrapperMainContent>
      </TabLayoutContainer>
    </>
  )
}

export default React.memo(KeyStoreEmailRecoverySetNewPasswordScreen)
