import { on } from 'events'
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
import usePrevious from '@common/hooks/usePrevious'
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
  const { isInitialized, subType } = useAccountPickerControllerState()
  const prevIsInitialized = usePrevious(isInitialized)
  const [agreedToBackupWarning, setAgreedToBackupWarning] = useState(false)

  const handleFormSubmit = useCallback(async () => {
    await storage.set('agreedToBackupWarning', { acceptedAt: Date.now() })

    await handleSubmit(({ privateKey }) => {
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
    if (!prevIsInitialized && isInitialized && subType === 'private-key') {
      dispatch({ type: 'ACCOUNT_PICKER_CONTROLLER_ADD_NEXT_ACCOUNT' })
      goToNextRoute()
    }
  }, [goToNextRoute, dispatch, getValues, isInitialized, prevIsInitialized, subType])

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
      header={<Header withAmbireLogo />}
    >
      <TabLayoutWrapperMainContent>
        <Panel
          type="onboarding"
          spacingsSize="small"
          withBackButton
          onBackButtonPress={goToPrevRoute}
          title={t('Import Private Key')}
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
                    testID="enter-seed-phrase-field"
                    onBlur={onBlur}
                    autoFocus
                    placeholder={t('Input Private Key')}
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
                uncheckedBorderColor={theme.primaryText}
                style={spacings.mlTy}
                label={
                  <Text fontSize={14}>{t('I know this key must be backed up securely.')}</Text>
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
