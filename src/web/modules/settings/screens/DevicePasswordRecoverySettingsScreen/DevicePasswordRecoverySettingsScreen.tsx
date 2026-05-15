import React, { useCallback, useContext, useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { EmailVaultState } from '@ambire-common/controllers/emailVault/emailVault'
import { isEmail } from '@ambire-common/services/validations'
import DisabledPasswordRecovery from '@common/assets/svg/DisabledPasswordRecovery'
import Alert from '@common/components/Alert'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import Input from '@common/components/Input'
import { PanelTitle } from '@common/components/Panel/Panel'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import { ROUTES, WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings, { SPACING_XL } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import EmailConfirmation from '@web/modules/keystore/components/EmailConfirmation'
import BottomSheetPasswordConfirmation from '@web/modules/settings/components/BottomSheetPasswordConfirmation'
import { SettingsRoutesContext } from '@web/modules/settings/contexts/SettingsRoutesContext'

const DevicePasswordRecoverySettingsScreen = () => {
  const { state: ev, dispatch: evDispatch } = useController('EmailVaultController')
  const { state: keystoreState, dispatch: keystoreDispatch } = useController('KeystoreController')
  const { t } = useTranslation()
  const { setCurrentSettingsPage } = useContext(SettingsRoutesContext)
  const { navigate } = useNavigation()
  const { theme } = useTheme()
  const {
    ref: passwordConfirmationModalRef,
    open: openPasswordConfirmationModal,
    close: closePasswordConfirmationModal
  } = useModalize()
  const {
    ref: confirmationModalRef,
    open: openConfirmationModal,
    close: closeConfirmationModal
  } = useModalize()

  const { ref: successModalRef, open: openSuccessModal, close: closeSuccessModal } = useModalize()

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
        ev.currentState === EmailVaultState.RemovingSecret)
    ) {
      openConfirmationModal()
      return
    }
    closeConfirmationModal()
    // Ref is stable, `.current` isn't a valid dep - safe to ignore.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closeConfirmationModal, ev.currentState, openConfirmationModal])

  useEffect(() => {
    if (ev.statuses.removeKeyStoreSecret === 'SUCCESS') {
      openSuccessModal()
    }
  }, [ev.statuses.removeKeyStoreSecret, openSuccessModal])

  const handleFormSubmit = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    handleSubmit(async () => {
      evDispatch({
        type: 'method',
        params: {
          method: 'removeKeyStoreSecret',
          args: [email]
        }
      })
    })()
  }, [handleSubmit, evDispatch, email])

  const closePasswordConfirmation = useCallback(() => {
    keystoreDispatch({
      type: 'method',
      params: {
        method: 'resetErrorState',
        args: []
      }
    })
    closePasswordConfirmationModal()
  }, [closePasswordConfirmationModal, keystoreDispatch])

  const handleDisablePress = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    handleSubmit(async () => {
      openPasswordConfirmationModal()
    })()
  }, [handleSubmit, openPasswordConfirmationModal])

  const handlePasswordConfirmed = useCallback(() => {
    closePasswordConfirmation()
    handleFormSubmit()
  }, [closePasswordConfirmation, handleFormSubmit])

  const handleCancelLoginAttempt = useCallback(() => {
    evDispatch({
      type: 'method',
      params: {
        method: 'cancelEmailConfirmation',
        args: []
      }
    })
  }, [evDispatch])

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

        <Controller
          control={control}
          // @ts-ignore minot type mismatch, (value) => isEmail(value) has no warns
          rules={{ validate: isEmail }}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              onBlur={onBlur}
              placeholder={t('E-mail')}
              onChangeText={onChange}
              inputWrapperStyle={{ backgroundColor: theme.tertiaryBackground }}
              onSubmitEditing={handleDisablePress}
              value={value}
              autoFocus={isWeb}
              isValid={isEmail(value)}
              error={!!errors.email && (t('Please fill in a valid email.') as string)}
              disabled
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
            !ev.hasKeystoreRecovery ||
            !isValid ||
            keystoreState.statuses.unlockWithSecret !== 'INITIAL'
          }
          type="primary"
          text={
            // eslint-disable-next-line no-nested-ternary
            isSubmitting || ev.currentState === EmailVaultState.Loading
              ? t('Loading...')
              : t('Disable')
          }
          onPress={handleDisablePress}
        />
        <Alert
          type="warning"
          isTypeLabelHidden
          style={spacings.mtXl}
          title={t('Email recovery will be deprecated soon')}
          titleWeight="semiBold"
          text={t(
            "Email-based password recovery for this device is being phased out. To avoid losing access, we recommend disabling it now and switching to biometric unlock - a more private, self-sovereign alternative that doesn't rely on Ambire infrastructure.\n\nDisable email recovery before it's removed."
          )}
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
      <BottomSheetPasswordConfirmation
        id="device-password-recovery-confirm-password-modal"
        sheetRef={passwordConfirmationModalRef}
        closeBottomSheet={closePasswordConfirmation}
        text={t('Please enter your extension password to disable email recovery.')}
        onPasswordConfirmed={handlePasswordConfirmed}
      />
      <BottomSheet id="backup-password-confirmation-modal" sheetRef={confirmationModalRef}>
        <EmailConfirmation email={email} handleCancelLoginAttempt={handleCancelLoginAttempt} />
      </BottomSheet>
      <BottomSheet id="backup-password-success-modal" sheetRef={successModalRef}>
        <PanelTitle title={t('Disabled password recovery')} style={spacings.mbXl} />
        <DisabledPasswordRecovery style={[flexbox.alignSelfCenter, spacings.mbXl]} />
        <Text fontSize={16} style={[spacings.mbXl, text.center]} appearance="secondaryText">
          {t('Your extension password recovery was successfully disabled!')}
        </Text>
        <Button
          text={t('Got it')}
          hasBottomSpacing={false}
          onPress={() => {
            closeSuccessModal()
          }}
        />
      </BottomSheet>
    </>
  )
}

export default React.memo(DevicePasswordRecoverySettingsScreen)
