import { getAddress, isAddress } from 'ethers'
import React, { useCallback, useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { View } from 'react-native'

import SafeIcon from '@common/assets/svg/SafeIcon'
import Alert from '@common/components/Alert'
import Button from '@common/components/Button'
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
import useBackgroundService from '@web/hooks/useBackgroundService'
import useSafeControllerState from '@web/hooks/useSafeControllerState'

const SafeImportScreen = () => {
  const { statuses, errorMessage, safeInfo } = useSafeControllerState()
  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors, isValid }
  } = useForm({
    mode: 'all',
    defaultValues: { safeAddress: safeInfo?.address || '' }
  })
  const { goToPrevRoute, goToNextRoute } = useOnboardingNavigation()
  const { t } = useTranslation()
  const [safe, setSafe] = useState<string | null>(safeInfo?.address || '')

  const { theme } = useTheme()
  const { dispatch } = useBackgroundService()

  const handleFormSubmit = useCallback(async () => {
    await handleSubmit(({ safeAddress }) => {
      const addr = getAddress(safeAddress.trim())
      // todo: handle continuation
      console.log('the safe addr', addr)
    })()
  }, [handleSubmit])

  const handleValidation = (value: string) => {
    const trimmedValue = value.trim()

    if (!trimmedValue.length) return t('Field is required.')

    if (!isAddress(trimmedValue)) return t('Invalid address.')

    return undefined
  }

  useEffect(() => {
    if (isValid) {
      const addr = getValues('safeAddress')
      if (addr !== safe) setSafe(getAddress(addr))
      if (addr !== safe && addr !== safeInfo?.address) {
        dispatch({
          type: 'SAFE_CONTROLLER_FIND_SAFE',
          params: { safeAddress: addr }
        })
      }
    } else {
      setSafe('')
    }
  }, [isValid, dispatch, getValues, safeInfo?.address, safe])

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
          title={t('Import safe address')}
          step={1}
          totalSteps={2}
        >
          <View style={[flexbox.justifySpaceBetween, flexbox.flex1]}>
            <View>
              <Controller
                control={control}
                rules={{ validate: (value) => handleValidation(value), required: true }}
                name="safeAddress"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    testID="add-safe-address-field"
                    onBlur={onBlur}
                    autoFocus
                    placeholder={t('Add safe address')}
                    onChangeText={onChange}
                    value={value}
                    isValid={!handleValidation(value) && !!value.length}
                    error={value.length ? errors?.safeAddress?.message : ''}
                    autoCorrect={false}
                    onSubmitEditing={handleFormSubmit}
                    disabled={false}
                  />
                )}
              />
            </View>

            {statuses.findSafe === 'LOADING' && (
              <View style={[flexbox.directionRow, flexbox.alignSelfCenter]}>
                <Text>Loading...</Text>
              </View>
            )}

            {safe && safeInfo && safe === safeInfo.address && (
              <View>
                <View style={[flexbox.directionRow, flexbox.alignCenter]}>
                  <SafeIcon width={20} height={20} />
                  <Text style={spacings.mlTy}>{t('Safe found')}</Text>
                </View>
                <Text>{t(`Threshold: ${safeInfo.threshold} / ${safeInfo.owners.length}`)}</Text>
                <Text>{t(`Owners : ${safeInfo.owners.map((o) => o).join(',')}`)}</Text>
              </View>
            )}

            {errorMessage && (
              <View style={[flexbox.alignCenter, flexbox.justifyCenter]}>
                <Alert type="error" text={errorMessage} />
              </View>
            )}

            <Button
              testID="import-button"
              size="large"
              text={t('Confirm')}
              hasBottomSpacing={false}
              onPress={handleFormSubmit}
              disabled={!isValid || !!errorMessage}
            />
          </View>
        </Panel>
      </TabLayoutWrapperMainContent>
    </TabLayoutContainer>
  )
}

export default SafeImportScreen
