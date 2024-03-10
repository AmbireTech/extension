import React, { useCallback, useContext, useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { EmailVaultState } from '@ambire-common/controllers/emailVault/emailVault'
import { isEmail } from '@ambire-common/services/validations'
import Alert from '@common/components/Alert'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import Button from '@common/components/Button'
import Input from '@common/components/Input'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import spacings, { SPACING_3XL, SPACING_XL } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useEmailVaultControllerState from '@web/hooks/useEmailVaultControllerState'
import useKeystoreControllerState from '@web/hooks/useKeystoreControllerState'
import EmailConfirmation from '@web/modules/keystore/components/EmailConfirmation'
import { SettingsRoutesContext } from '@web/modules/settings/contexts/SettingsRoutesContext'
import useNavigation from '@common/hooks/useNavigation'
import { ROUTES } from '@common/modules/router/constants/common'

const DevicePasswordRecoverySettingsScreen = () => {
  const ev = useEmailVaultControllerState()
  const keystoreState = useKeystoreControllerState()
  const { t } = useTranslation()
  const { setCurrentSettingsPage } = useContext(SettingsRoutesContext)
  const { navigate } = useNavigation()
  const {
    ref: confirmationModalRef,
    open: openConfirmationModal,
    close: closeConfirmationModal
  } = useModalize()

  const { dispatch } = useBackgroundService()

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    reValidateMode: 'onChange',
    defaultValues: {
      email: ev.keystoreRecoveryEmail || '' // it should be string, otherwise it will cause a crash
    }
  })

  useEffect(() => {
    setCurrentSettingsPage('device-password-recovery')
  }, [setCurrentSettingsPage])

  const email = watch('email')

  useEffect(() => {
    // On a first render, `confirmationModalRef.current` is null and `openConfirmationModal` doesn't work.
    // Because of this, we are adding the modal ref to the deps,
    // in order to make it working again on initial component render.
    if (
      confirmationModalRef.current &&
      (ev.currentState === EmailVaultState.WaitingEmailConfirmation ||
        ev.currentState === EmailVaultState.UploadingSecret)
    ) {
      openConfirmationModal()
      return
    }
    closeConfirmationModal()
  }, [closeConfirmationModal, ev.currentState, openConfirmationModal, confirmationModalRef.current])

  const handleFormSubmit = useCallback(() => {
    handleSubmit(async () => {
      dispatch({ type: 'EMAIL_VAULT_CONTROLLER_UPLOAD_KEYSTORE_SECRET', params: { email } })
    })()
  }, [handleSubmit, dispatch, email])

  const handleCancelLoginAttempt = useCallback(() => {
    dispatch({
      type: 'EMAIL_VAULT_CONTROLLER_CANCEL_CONFIRMATION'
    })
  }, [dispatch])

  return (
    <>
      <View style={{ ...flexbox.flex1, maxWidth: 440 }}>
        <Text weight="medium" fontSize={20} style={[spacings.mtTy, spacings.mb2Xl]}>
          {t('Device Password Recovery with email')}
        </Text>

        {!keystoreState.hasPasswordSecret && (
          <Alert
            type="warning"
            isTypeLabelHidden
            style={spacings.mbXl}
            title={
              <Text appearance="warningText" weight="semiBold">
                {t('Set Device Password')}
              </Text>
            }
            text={t(
              'Before enabling Device Password Recovery via email, you need to first set a password for your device.'
            )}
          >
            <Button
              style={{ alignSelf: 'flex-start', ...spacings.phXl, ...spacings.mt }}
              textStyle={{ fontSize: 14 }}
              type="primary"
              text={t('Set Device Password')}
              hasBottomSpacing={false}
              onPress={() =>
                navigate(ROUTES.devicePasswordSet, { state: { flow: 'password-recovery' } })
              }
            />
          </Alert>
        )}

        {ev.hasKeystoreRecovery && (
          <Alert
            type="success"
            title={t('Email recovery enabled!')}
            size="sm"
            style={{ ...spacings.mbTy }}
            isTypeLabelHidden
          />
        )}
        <Controller
          control={control}
          rules={{
            validate: isEmail
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              onBlur={onBlur}
              placeholder={t('E-mail')}
              onChangeText={onChange}
              onSubmitEditing={handleFormSubmit}
              value={value}
              autoFocus={isWeb}
              isValid={isEmail(value)}
              error={!!errors.email && (t('Please fill in a valid email.') as string)}
              disabled={ev.hasKeystoreRecovery || !keystoreState.hasPasswordSecret}
            />
          )}
          name="email"
        />
        <Button
          style={{ alignSelf: 'flex-start', paddingHorizontal: SPACING_XL }}
          textStyle={{ fontSize: 14 }}
          disabled={
            ev.currentState === EmailVaultState.Loading ||
            isSubmitting ||
            !email ||
            ev.hasKeystoreRecovery
          }
          type="primary"
          text={
            // eslint-disable-next-line no-nested-ternary
            isSubmitting || ev.currentState === EmailVaultState.Loading
              ? t('Loading...')
              : ev.hasKeystoreRecovery
              ? t('Enabled')
              : t('Enable')
          }
          onPress={handleFormSubmit}
        />
        <Alert
          type="info"
          isTypeLabelHidden
          style={spacings.mtXl}
          title={t('How it works')}
          titleWeight="semiBold"
          text={t(
            'Email-based keystore recovery is locally enabled, and it does not upload any keys.'
          )}
        />
      </View>
      <BottomSheet
        backgroundColor="primaryBackground"
        id="backup-password-confirmation-modal"
        sheetRef={confirmationModalRef}
        style={{ paddingVertical: SPACING_3XL }}
      >
        <ModalHeader title={t('Email Confirmation Required')} />
        <EmailConfirmation email={email} handleCancelLoginAttempt={handleCancelLoginAttempt} />
      </BottomSheet>
    </>
  )
}

export default React.memo(DevicePasswordRecoverySettingsScreen)
