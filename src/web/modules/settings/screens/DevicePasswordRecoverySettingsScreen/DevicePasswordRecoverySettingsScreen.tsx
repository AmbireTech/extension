import React, { useCallback, useContext, useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { EmailVaultState } from '@ambire-common/controllers/emailVault/emailVault'
import { isEmail } from '@ambire-common/services/validations'
import KeyStoreIcon from '@common/assets/svg/KeyStoreIcon'
import Alert from '@common/components/Alert'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import Input from '@common/components/Input'
import { PanelTitle } from '@common/components/Panel/Panel'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings, { SPACING_XL } from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useEmailVaultControllerState from '@web/hooks/useEmailVaultControllerState'
import useKeystoreControllerState from '@web/hooks/useKeystoreControllerState'
import EmailConfirmation from '@web/modules/keystore/components/EmailConfirmation'
import { SettingsRoutesContext } from '@web/modules/settings/contexts/SettingsRoutesContext'

const DevicePasswordRecoverySettingsScreen = () => {
  const ev = useEmailVaultControllerState()
  const keystoreState = useKeystoreControllerState()
  const { t } = useTranslation()
  const { setCurrentSettingsPage } = useContext(SettingsRoutesContext)
  const { navigate } = useNavigation()
  const { themeType } = useTheme()
  const {
    ref: confirmationModalRef,
    open: openConfirmationModal,
    close: closeConfirmationModal
  } = useModalize()

  const { ref: successModalRef, open: openSuccessModal, close: closeSuccessModal } = useModalize()

  const { dispatch } = useBackgroundService()

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isValid }
  } = useForm({
    mode: 'all',
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
    // Ref is stable, `.current` isn't a valid dep - safe to ignore.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closeConfirmationModal, ev.currentState, openConfirmationModal])

  useEffect(() => {
    if (ev.statuses.uploadKeyStoreSecret === 'SUCCESS') {
      openSuccessModal()
    }
  }, [ev.statuses.uploadKeyStoreSecret, openSuccessModal])

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
          {t('Extension password recovery with email')}
        </Text>

        {!keystoreState.hasPasswordSecret && (
          <Alert
            type="warning"
            isTypeLabelHidden
            style={spacings.mbXl}
            title={
              <Text appearance="warningText" weight="semiBold">
                {t('Set extension password')}
              </Text>
            }
            text={t(
              'Before enabling extension password recovery via email, you need to first set a password for your device.'
            )}
            buttonProps={{
              text: t('Set extension password'),
              onPress: () =>
                navigate(ROUTES.devicePasswordSet, { state: { flow: 'password-recovery' } })
            }}
          />
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
          disabled={
            ev.currentState === EmailVaultState.Loading ||
            isSubmitting ||
            !email ||
            ev.hasKeystoreRecovery ||
            !isValid
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
            "This is a recovery mechanism for your local extension password via email. \nPlease note that it doesn't upload any keys, and it is not an account recovery mechanism. \nIt is just an alternative way of unlocking your extension on this device in case you forget your password."
          )}
        />
      </View>
      <BottomSheet
        id="backup-password-confirmation-modal"
        sheetRef={confirmationModalRef}
        style={{ width: 400 }}
        backgroundColor={
          themeType === THEME_TYPES.DARK ? 'secondaryBackground' : 'primaryBackground'
        }
      >
        <EmailConfirmation email={email} handleCancelLoginAttempt={handleCancelLoginAttempt} />
      </BottomSheet>
      <BottomSheet
        id="backup-password-success-modal"
        sheetRef={successModalRef}
        style={{ width: 400 }}
        backgroundColor={
          themeType === THEME_TYPES.DARK ? 'secondaryBackground' : 'primaryBackground'
        }
      >
        <PanelTitle title={t('Extension password recovery')} style={spacings.mbXl} />
        <KeyStoreIcon style={[flexbox.alignSelfCenter, spacings.mbXl]} />
        <Text fontSize={16} style={[spacings.mbXl, text.center]} appearance="secondaryText">
          {t('Your extension password recovery was successfully enabled!')}
        </Text>
        <Button text={t('Got it')} hasBottomSpacing={false} onPress={closeSuccessModal as any} />
      </BottomSheet>
    </>
  )
}

export default React.memo(DevicePasswordRecoverySettingsScreen)
