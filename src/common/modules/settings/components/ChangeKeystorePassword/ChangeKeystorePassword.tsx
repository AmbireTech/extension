import React, { useEffect } from 'react'
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
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
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
  const { control, errors, newPassword, errorMessage, resetErrorState, status } = form
  const { handleChangeKeystorePassword } = form

  useEffect(() => {
    if (status === 'SUCCESS') openModal()
  }, [openModal, status])

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
              testID="enter-current-pass-field"
              onBlur={onBlur}
              placeholder={t('Enter current password')}
              onChangeText={(val: string) => {
                onChange(val)
                if (errorMessage) resetErrorState()
              }}
              isValid={isValidPassword(value)}
              value={value}
              error={
                errors.password &&
                (errors.password.message || t('Please fill in at least 8 characters for password.'))
              }
              autoFocus
              containerStyle={spacings.mbTy}
              inputWrapperStyle={{ backgroundColor: theme.tertiaryBackground }}
              onSubmitEditing={handleChangeKeystorePassword}
            />
          )}
          name="password"
        />
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
      <BottomSheet id="device-password-success-modal" sheetRef={modalRef}>
        <PanelTitle title={successModalTitle} style={spacings.mbXl} />
        <KeyStoreIcon style={[flexbox.alignSelfCenter, spacings.mbXl]} />
        <Text fontSize={16} style={[spacings.mbLg, text.center]} appearance="secondaryText">
          {successText}
        </Text>
        <Button
          testID="device-pass-success-modal"
          text={t('Got it')}
          hasBottomSpacing={false}
          style={{ minWidth: 232 }}
          onPress={() => closeModal()}
        />
      </BottomSheet>
    </>
  )
}

export default React.memo(ChangeKeystorePassword)
