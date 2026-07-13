import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import Panel from '@common/components/Panel'
import useController from '@common/hooks/useController'
import useNavigation from '@common/hooks/useNavigation'
import usePrevious from '@common/hooks/usePrevious'
import useTheme from '@common/hooks/useTheme'
import { HeaderWithLogoOnly } from '@common/modules/header/components/Header/Header'
import { ROUTES } from '@common/modules/router/constants/common'
import {
  TabLayoutContainer,
  TabLayoutWrapperMainContent
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import PinExtension from '@web/modules/auth/components/PinExtension'
import KeyStoreSetNewPasswordForm from '@web/modules/keystore/components/KeyStoreSetNewPasswordForm'

import KeyStoreSetNewPasswordCompleted from '../../components/KeyStoreSetNewPasswordCompleted/KeyStoreSetNewPasswordCompleted'

const KeyStoreEmailRecoverySetNewPasswordScreen = () => {
  const { t } = useTranslation()
  const [passwordResetCompleted, setPasswordResetCompleted] = useState(false)

  const { theme } = useTheme()
  const { navigate } = useNavigation()
  const { state: emailVault, dispatch: evDispatch } = useController('EmailVaultController')

  const prevRecoverKeyStoreStatus = usePrevious(emailVault.statuses.recoverKeyStore)
  const handleBackButtonPress = useCallback(() => {
    evDispatch({
      type: 'method',
      params: {
        method: 'cancelEmailConfirmation',
        args: []
      }
    })
    navigate(ROUTES.keyStoreEmailRecovery)
  }, [navigate, evDispatch])

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
        header={<HeaderWithLogoOnly />}
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
