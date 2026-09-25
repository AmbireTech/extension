import React, { useCallback, useEffect, useRef } from 'react'
import { Controller } from 'react-hook-form'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { isValidPassword } from '@ambire-common/services/validations'
import KeyStoreIcon from '@common/assets/svg/KeyStoreIcon'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import Input from '@common/components/Input'
import InputPassword from '@common/components/InputPassword'
import { PanelTitle } from '@common/components/Panel/Panel'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import PasswordConfirmation from '@common/modules/settings/components/PasswordConfirmation'
import { UseChangeKeystorePasswordReturn } from '@common/modules/settings/hooks/useChangeKeystorePassword'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

interface Props {
  form: UseChangeKeystorePasswordReturn
  // Optional inline heading. On mobile the screen header already shows the title,
  // so it is omitted there and only passed on the extension.
  title?: string
  successModalTitle: string
  successText: string
  // The submit button. Rendered inline below the fields on the extension, while on
  // mobile it lives in the screen footer, so it is left out here.
  submitButton?: React.ReactNode
}

const ChangeKeystorePassword: React.FC<Props> = ({
  form,
  title,
  successModalTitle,
  successText,
  submitButton
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { ref: modalRef, open: openModal, close: closeModal } = useModalize()
  const { control, errors, newPassword, status } = form
  const {
    handleChangeKeystorePassword,
    confirmationModalRef,
    closeConfirmation,
    changePassword,
    changePasswordAfterBiometrics
  } = form

  // Two sheets animating over each other is what leaves the screen half laid out, so the success
  // waits for the confirmation to have finished closing rather than opening alongside it.
  const shouldOpenSuccessRef = useRef(false)
  const isConfirmationOpenRef = useRef(false)

  useEffect(() => {
    if (status !== 'SUCCESS') return

    // Nothing to wait for if the user closed the confirmation while the change was still running
    if (!isConfirmationOpenRef.current) {
      openModal()
      return
    }

    shouldOpenSuccessRef.current = true
    closeConfirmation()
  }, [closeConfirmation, openModal, status])

  // `onOpen` rather than `onOpened`, because the web sheet only wires the former
  const handleConfirmationOpen = useCallback(() => {
    isConfirmationOpenRef.current = true
  }, [])

  const handleConfirmationClosed = useCallback(() => {
    isConfirmationOpenRef.current = false

    if (!shouldOpenSuccessRef.current) return

    shouldOpenSuccessRef.current = false
    openModal()
  }, [openModal])

  return (
    <>
      <View style={{ maxWidth: 440 }}>
        {!!title && (
          <Text weight="medium" fontSize={20} style={[spacings.mtTy, spacings.mb2Xl]}>
            {title}
          </Text>
        )}
        <Controller
          control={control}
          rules={{ validate: isValidPassword }}
          render={({ field: { onChange, onBlur, value } }) => (
            <InputPassword
              testID="enter-new-pass-field"
              onBlur={onBlur}
              placeholder={t('Enter new password')}
              onChangeText={onChange}
              isValid={isValidPassword(value)}
              value={value}
              error={
                errors.newPassword &&
                (t('Please fill in at least 8 characters for password.') as string)
              }
              containerStyle={spacings.mbTy}
              inputWrapperStyle={{ backgroundColor: theme.tertiaryBackground }}
              onSubmitEditing={handleChangeKeystorePassword}
            />
          )}
          name="newPassword"
        />
        <Controller
          control={control}
          rules={{
            validate: (value) => newPassword === value
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              testID="repeat-new-pass-field"
              onBlur={onBlur}
              placeholder={t('Repeat new password')}
              onChangeText={onChange}
              value={value}
              isValid={!!value && !errors.newPassword && newPassword === value}
              validLabel={t('The new passwords match, you are ready to continue')}
              secureTextEntry
              error={errors.confirmNewPassword && (t("The new passwords don't match.") as string)}
              autoCorrect={false}
              containerStyle={spacings.mbXl}
              inputWrapperStyle={{ backgroundColor: theme.tertiaryBackground }}
              onSubmitEditing={handleChangeKeystorePassword}
            />
          )}
          name="confirmNewPassword"
        />
        {submitButton}
      </View>
      <BottomSheet
        id="change-password-confirmation-modal"
        sheetRef={confirmationModalRef}
        type={isWeb ? 'modal' : 'bottom-sheet'}
        closeBottomSheet={closeConfirmation}
        onOpen={handleConfirmationOpen}
        onClosed={handleConfirmationClosed}
        // Without these the content stacks at the top instead of filling the modal, so the
        // confirmation cannot centre itself or put its way out at the bottom
        scrollViewProps={isWeb ? { contentContainerStyle: { flex: 1 } } : undefined}
        containerInnerWrapperStyles={isWeb ? { flex: 1 } : undefined}
        style={isWeb ? { maxWidth: 432, minHeight: 432, ...spacings.pvLg } : undefined}
      >
        <PasswordConfirmation
          // The old password goes straight to the keystore, which checks it while re-wrapping
          // the main key. Confirming it here first would only derive the very same key twice.
          onCustomSubmit={changePassword}
          onPasswordConfirmed={changePassword}
          onBiometricsConfirmed={changePasswordAfterBiometrics}
          onBackButtonPress={closeConfirmation}
          text={t('Please enter your current password to change it.')}
          submitText={t('Change password')}
          isSubmitting={status === 'LOADING'}
          withFullHeightLayout
        />
      </BottomSheet>
      <BottomSheet
        id="device-password-success-modal"
        sheetRef={modalRef}
        type={isWeb ? 'modal' : 'bottom-sheet'}
        // Same shape as the confirmation it follows, so the two do not resize around each other
        scrollViewProps={isWeb ? { contentContainerStyle: { flex: 1 } } : undefined}
        containerInnerWrapperStyles={isWeb ? { flex: 1 } : undefined}
        style={isWeb ? { maxWidth: 432, minHeight: 432, ...spacings.pvLg } : undefined}
      >
        {/* PanelTitle grows to fill what it is given, so it is boxed to its own height here -
        otherwise it takes the modal and pushes everything below it to the bottom */}
        <View>
          <PanelTitle title={successModalTitle} style={spacings.mbXl} />
        </View>
        {/* The gap to the button below. On the web it sits under the centred content, on mobile
        the sheet is only as tall as what is in it, so this is the whole of the breathing room */}
        <View style={[flexbox.flex1, flexbox.center, spacings.mbLg]}>
          <KeyStoreIcon style={[flexbox.alignSelfCenter, spacings.mbXl]} />
          <Text fontSize={16} style={text.center} appearance="secondaryText">
            {successText}
          </Text>
        </View>
        <Button
          testID="device-pass-success-modal"
          text={t('Got it')}
          hasBottomSpacing={false}
          onPress={() => closeModal()}
        />
      </BottomSheet>
    </>
  )
}

export default React.memo(ChangeKeystorePassword)
