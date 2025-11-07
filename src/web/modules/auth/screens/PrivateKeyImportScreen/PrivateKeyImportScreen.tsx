import React, { useCallback, useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { View } from 'react-native'

import { isValidPrivateKey } from '@ambire-common/libs/keyIterator/keyIterator'
import Button from '@common/components/Button'
import Checkbox from '@common/components/Checkbox'
import Input from '@common/components/Input'
import Panel from '@common/components/Panel'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import Header from '@common/modules/header/components/Header'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import {
  TabLayoutContainer,
  TabLayoutWrapperMainContent
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import storage from '@web/extension-services/background/webapi/storage'
import useAccountPickerControllerState from '@web/hooks/useAccountPickerControllerState'
import useBackgroundService from '@web/hooks/useBackgroundService'

export const CARD_WIDTH = 400

const PrivateKeyImportScreen = () => {
  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors, isValid }
  } = useForm({
    mode: 'all',
    defaultValues: { privateKey: '' }
  })
  const { goToPrevRoute, goToNextRoute } = useOnboardingNavigation()
  const { t } = useTranslation()

  const { theme } = useTheme()
  const { dispatch } = useBackgroundService()
  const { initParams, subType } = useAccountPickerControllerState()
  const [agreedToBackupWarning, setAgreedToBackupWarning] = useState(false)
  const [importButtonPressed, setImportButtonPressed] = useState(false)

  const handleFormSubmit = useCallback(async () => {
    await storage.set('agreedToBackupWarning', { acceptedAt: Date.now() })

    await handleSubmit(({ privateKey }) => {
      setImportButtonPressed(true)
      const trimmedPrivateKey = privateKey.trim()
      const noPrefixPrivateKey =
        trimmedPrivateKey.slice(0, 2) === '0x' ? trimmedPrivateKey.slice(2) : trimmedPrivateKey

      dispatch({
        type: 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_PRIVATE_KEY_OR_SEED_PHRASE',
        params: { privKeyOrSeed: noPrefixPrivateKey }
      })
    })()
  }, [dispatch, handleSubmit])

  useEffect(() => {
    if (!getValues('privateKey')) return
    if (!!importButtonPressed && initParams && subType === 'private-key') {
      setImportButtonPressed(false)
      goToNextRoute()
    }
  }, [goToNextRoute, dispatch, getValues, initParams, importButtonPressed, subType])

  const handleValidation = (value: string) => {
    const trimmedValue = value.trim()

    if (!trimmedValue.length) return t('Field is required.')

    if (!isValidPrivateKey(trimmedValue)) {
      return t('Invalid private key.')
    }

    return undefined
  }

  return (
    <TabLayoutContainer
      backgroundColor={theme.secondaryBackground}
      header={<Header mode="custom-inner-content" withAmbireLogo />}
    >
      <TabLayoutWrapperMainContent>
        <Panel
          type="onboarding"
          spacingsSize="small"
          withBackButton
          onBackButtonPress={goToPrevRoute}
          title={t('Import private key')}
          step={1}
          totalSteps={2}
        >
          <View style={[flexbox.justifySpaceBetween, flexbox.flex1]}>
            <View>
              <Controller
                control={control}
                rules={{ validate: (value) => handleValidation(value), required: true }}
                name="privateKey"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    testID="enter-private-key-field"
                    onBlur={onBlur}
                    autoFocus
                    placeholder={t('Input private key')}
                    onChangeText={onChange}
                    value={value}
                    isValid={!handleValidation(value) && !!value.length}
                    validLabel={t('✅ Valid private key')}
                    secureTextEntry
                    error={value.length ? errors?.privateKey?.message : ''}
                    autoCorrect={false}
                    onSubmitEditing={handleFormSubmit}
                  />
                )}
              />
              <Checkbox
                value={agreedToBackupWarning}
                onValueChange={() => setAgreedToBackupWarning((prev) => !prev)}
                testID="backup-warning-checkbox"
                style={spacings.mlTy}
                label={
                  <Text fontSize={14} appearance="secondaryText">
                    {t('I know I must keep a secure backup of my key.')}
                  </Text>
                }
              />
            </View>

            <Button
              testID="import-button"
              size="large"
              text={t('Confirm')}
              hasBottomSpacing={false}
              onPress={handleFormSubmit}
              disabled={!isValid || !agreedToBackupWarning}
            />
          </View>
        </Panel>
      </TabLayoutWrapperMainContent>
    </TabLayoutContainer>
  )
}

export default PrivateKeyImportScreen
