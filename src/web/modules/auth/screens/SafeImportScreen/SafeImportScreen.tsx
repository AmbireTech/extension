import { getAddress, isAddress } from 'ethers'
import React, { useCallback, useEffect, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { View } from 'react-native'

import SafeIcon from '@common/assets/svg/SafeIcon'
import Alert from '@common/components/Alert'
import Button from '@common/components/Button'
import Input from '@common/components/Input'
import NetworkIcon from '@common/components/NetworkIcon'
import Panel from '@common/components/Panel'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
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
  const { statuses, importError, safeInfo } = useSafeControllerState()
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset
  } = useForm({
    mode: 'all',
    defaultValues: { safeAddress: '' }
  })
  const [isLoading, setIsLoading] = useState(false)
  const { addToast } = useToast()
  const safeAddressValue = useWatch({
    control,
    name: 'safeAddress'
  })
  const { goToPrevRoute, goToNextRoute } = useOnboardingNavigation()
  const { t } = useTranslation()
  const [safe, setSafe] = useState<string | null>('')

  const { theme } = useTheme()
  const { dispatch } = useBackgroundService()

  const handleFormSubmit = useCallback(async () => {
    if (!safe || !safeInfo || isLoading) return

    try {
      // TODO: configure ens?
      setIsLoading(true)
      dispatch({
        type: 'ACCOUNTS_CONTROLLER_ADD_ACCOUNTS',
        params: {
          accounts: [
            {
              addr: safe,
              associatedKeys: safeInfo.owners,
              initialPrivileges: [], // not applicable for safe accounts,
              creation: {
                factoryAddr: safeInfo.factoryAddr,
                singleton: safeInfo.singleton,
                setupData: safeInfo.setupData,
                saltNonce: safeInfo.saltNonce
              },
              preferences: {
                label: 'Safe',
                pfp: safe
              }
            }
          ]
        }
      })
      reset()
      goToNextRoute()
    } catch (e: any) {
      setIsLoading(false)
      addToast(
        t(
          `Import unsuccessful. We were unable to fetch the necessary data.${
            e?.message ? ` Error: ${e?.message}` : ''
          }`
        ),
        { type: 'error' }
      )

      throw e
    }
  }, [goToNextRoute, addToast, dispatch, t, safe, safeInfo, reset, isLoading])

  const handleValidation = (value: string) => {
    const trimmedValue = value.trim()

    if (!trimmedValue.length) return t('Field is required.')

    if (!isAddress(trimmedValue)) return t('Invalid address.')

    return undefined
  }

  useEffect(() => {
    const safeAddr = safeAddressValue.trim()
    if (!safeAddr.length || !isAddress(safeAddr)) {
      setSafe('')
      return
    }

    if (safeAddr !== safe) setSafe(getAddress(safeAddr))
    if (safeAddr !== safe && safeAddr !== safeInfo?.address) {
      dispatch({
        type: 'SAFE_CONTROLLER_FIND_SAFE',
        params: { safeAddress: safeAddr }
      })
    }
  }, [dispatch, safeAddressValue, safeInfo?.address, safe])

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
          totalSteps={1}
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
              {statuses.findSafe === 'LOADING' ? (
                <View style={[flexbox.directionRow, flexbox.alignSelfCenter]}>
                  <Spinner />
                </View>
              ) : (
                <View>
                  {safe && safeInfo && safe === safeInfo.address && (
                    <View style={[flexbox.directionRow, flexbox.justifySpaceBetween]}>
                      <View style={[flexbox.directionRow, flexbox.alignCenter]}>
                        <SafeIcon width={20} height={20} />
                        <Text style={spacings.mlTy}>{t('Deployed on:')}</Text>
                      </View>
                      <View style={[flexbox.directionRow, flexbox.alignCenter]}>
                        {safeInfo.deployedOn.map((c, i) => (
                          <NetworkIcon
                            key={c}
                            id={c.toString()}
                            style={i === 0 ? { marginLeft: '0' } : { marginLeft: '-11px' }}
                            size={22}
                          />
                        ))}
                      </View>
                    </View>
                  )}

                  {importError && safe && safe === importError.address && (
                    <View style={[flexbox.alignCenter, flexbox.justifyCenter]}>
                      <Alert type="error" text={importError.message} style={{ maxWidth: '100%' }} />
                    </View>
                  )}
                </View>
              )}
            </View>

            <Button
              testID="import-button"
              size="large"
              text={isLoading ? t('Importing...') : t('Import')}
              hasBottomSpacing={false}
              onPress={handleSubmit(handleFormSubmit)}
              disabled={!isValid || !!importError || statuses.findSafe === 'LOADING'}
            />
          </View>
        </Panel>
      </TabLayoutWrapperMainContent>
    </TabLayoutContainer>
  )
}

export default SafeImportScreen
