import { isValidPassword } from 'ambire-common/src/services/validations'
import React, { useCallback } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Image, Keyboard, View } from 'react-native'

import logo from '@common/assets/images/Ambire-Wallet-logo-colored-white-vertical.png'
import KeyStoreIcon from '@common/assets/svg/KeyStoreIcon'
import Button from '@common/components/Button'
import InputPassword from '@common/components/InputPassword'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useDisableNavigatingBack from '@common/hooks/useDisableNavigatingBack'
import useNavigation from '@common/hooks/useNavigation'
import useRoute from '@common/hooks/useRoute'
import AnimatedArrows from '@common/modules/auth/components/AnimatedArrows'
import colors from '@common/styles/colors'
import spacings, { IS_SCREEN_SIZE_S } from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import {
  TabLayoutWrapperMainContent,
  TabLayoutWrapperSideContent
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'

const AddAccountPasswordToVaultScreen = () => {
  const { t } = useTranslation()
  const route = useRoute()
  const navigation = useNavigation()
  const { loginType } = route.params

  useDisableNavigatingBack(navigation)
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isValid }
  } = useForm({
    mode: 'all',
    defaultValues: {
      password: ''
    }
  })

  const handleFormSubmit = useCallback(() => {
    !isWeb && Keyboard.dismiss()

    handleSubmit(async ({ password }) => {
      // TODO: v2
    })()
  }, [handleSubmit])

  const handleCancelLoginAttempts = useCallback(() => {
    // TODO: v2
  }, [])

  return (
    <>
      <TabLayoutWrapperMainContent>
        <View
          style={[
            flexboxStyles.directionRow,
            flexboxStyles.justifyCenter,
            flexboxStyles.alignCenter,
            spacings.pv
          ]}
        >
          <Image
            source={logo}
            style={{
              height: IS_SCREEN_SIZE_S ? 96 : 136,
              width: 120,
              ...(isWeb ? { modalHeight: 120 } : {})
            }}
            resizeMode="contain"
          />
          <AnimatedArrows />
          <KeyStoreIcon height={IS_SCREEN_SIZE_S ? 96 : 136} width={120} />
        </View>

        <View>
          <Text weight="regular" style={[spacings.mbMi, spacings.phTy]} fontSize={13}>
            {t(
              'When you add your account password to the Key Store, you will be able to sign transactions on this device using your passphrase only.'
            )}
          </Text>
          <Text weight="regular" style={[spacings.mb, spacings.phTy]} fontSize={13}>
            {t(
              'If you reset your passphrase or {{action}}, the Key Store will be removed from the device, however you can still use your account password on any other device.',
              { action: isWeb ? t('remove the extension') : t('uninstall the app') }
            )}
          </Text>

          <Controller
            control={control}
            rules={{ validate: isValidPassword }}
            render={({ field: { onChange, onBlur, value } }) => (
              <InputPassword
                onBlur={onBlur}
                placeholder={t('Ambire account password')}
                onChangeText={onChange}
                isValid={isValidPassword(value)}
                autoFocus={isWeb}
                disabled={isSubmitting}
                value={value}
                error={
                  errors.password &&
                  (t('Please fill in at least 8 characters for password.') as string)
                }
                onSubmitEditing={handleFormSubmit}
              />
            )}
            name="password"
          />

          <Button
            disabled={isSubmitting || !isValid}
            text={isSubmitting ? t('Adding to Key Store...') : t('Add password to Key Store')}
            onPress={handleFormSubmit}
          />

          <Button
            type="outline"
            accentColor={colors.howl}
            text={t('Cancel Login Attempt')}
            onPress={handleCancelLoginAttempts}
          />
        </View>
      </TabLayoutWrapperMainContent>
      <TabLayoutWrapperSideContent backgroundType="beta">
        <Text weight="regular" color={colors.titan}>
          {t(
            'When you add your account password to the Key Store, you will be able to sign transactions on this device using your passphrase only.'
          )}
        </Text>
      </TabLayoutWrapperSideContent>
    </>
  )
}

export default AddAccountPasswordToVaultScreen
