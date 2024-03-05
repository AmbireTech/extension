import React, { useCallback, useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { View } from 'react-native'

import { isValidPrivateKey } from '@ambire-common/libs/keyIterator/keyIterator'
import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import BackButton from '@common/components/BackButton'
import Button from '@common/components/Button'
import Panel from '@common/components/Panel'
import TextArea from '@common/components/TextArea'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import useStepper from '@common/modules/auth/hooks/useStepper'
import Header from '@common/modules/header/components/Header'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import {
  TabLayoutContainer,
  TabLayoutWrapperMainContent
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import useAccountAdderControllerState from '@web/hooks/useAccountAdderControllerState'
import useBackgroundService from '@web/hooks/useBackgroundService'
import Stepper from '@web/modules/router/components/Stepper'

const PrivateKeyImportScreen = () => {
  const {
    control,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm({
    mode: 'all',
    defaultValues: {
      privateKey: ''
    }
  })
  const { updateStepperState } = useStepper()
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const { theme } = useTheme()
  const { dispatch } = useBackgroundService()
  const accountAdderCtrlState = useAccountAdderControllerState()

  useEffect(() => {
    updateStepperState(WEB_ROUTES.importPrivateKey, 'private-key')
  }, [updateStepperState])

  useEffect(() => {
    if (accountAdderCtrlState.isInitialized) navigate(WEB_ROUTES.accountAdder)
  }, [accountAdderCtrlState.isInitialized, navigate])

  const handleFormSubmit = useCallback(async () => {
    await handleSubmit(({ privateKey }) => {
      const trimmedPrivateKey = privateKey.trim()
      const noPrefixPrivateKey =
        trimmedPrivateKey.slice(0, 2) === '0x' ? trimmedPrivateKey.slice(2) : trimmedPrivateKey

      dispatch({
        type: 'MAIN_CONTROLLER_ACCOUNT_ADDER_INIT_PRIVATE_KEY_OR_SEED_PHRASE',
        params: { privKeyOrSeed: noPrefixPrivateKey }
      })
    })()
  }, [dispatch, handleSubmit])

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
      width="md"
      header={
        <Header mode="custom-inner-content" withAmbireLogo>
          <Stepper />
        </Header>
      }
      footer={
        <>
          <BackButton />
          <Button
            size="large"
            text={t('Import')}
            hasBottomSpacing={false}
            onPress={handleFormSubmit}
            disabled={!isValid}
          >
            <View style={spacings.pl}>
              <RightArrowIcon color={colors.titan} />
            </View>
          </Button>
        </>
      }
    >
      <TabLayoutWrapperMainContent>
        <Panel title={t('Import your Private Key')}>
          <Controller
            control={control}
            rules={{ validate: (value) => handleValidation(value), required: true }}
            name="privateKey"
            render={({ field: { onChange, onBlur, value } }) => {
              return (
                <TextArea
                  value={value}
                  editable
                  multiline
                  numberOfLines={3}
                  autoFocus
                  containerStyle={spacings.mb0}
                  placeholder={t('Enter a private key')}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  isValid={!handleValidation(value) && !!value.length}
                  error={errors?.privateKey?.message || ' '}
                  placeholderTextColor={theme.secondaryText}
                  onSubmitEditing={handleFormSubmit}
                />
              )
            }}
          />
        </Panel>
      </TabLayoutWrapperMainContent>
    </TabLayoutContainer>
  )
}

export default PrivateKeyImportScreen
