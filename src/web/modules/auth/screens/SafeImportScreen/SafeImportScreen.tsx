import { getAddress, isAddress } from 'ethers'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { View } from 'react-native'

import SafeIcon from '@common/assets/svg/SafeIcon'
import SuccessIcon from '@common/assets/svg/SuccessIcon'
import Alert from '@common/components/Alert'
import Button from '@common/components/Button'
import Input from '@common/components/Input'
import NetworkIcon from '@common/components/NetworkIcon'
import Panel from '@common/components/Panel'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
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

const SafeImportScreen = () => {
  const { dispatch: safeDispatch, state } = useController('SafeController')
  const { dispatch: accountsDispatch, state: accountsState } = useController('AccountsController')
  const { statuses, importError, safeInfo } = state
  const { accounts } = accountsState
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

  const handleFormSubmit = useCallback(async () => {
    if (!safe || !safeInfo || isLoading) return

    try {
      setIsLoading(true)
      accountsDispatch({
        type: 'method',
        params: {
          method: 'addAccounts',
          args: [
            [
              {
                addr: safe,
                associatedKeys: safeInfo.owners,
                initialPrivileges: safeInfo.owners.map((o) => [o, '0x01']),
                creation: null,
                safeCreation: {
                  factoryAddr: safeInfo.factoryAddr,
                  singleton: safeInfo.singleton,
                  setupData: safeInfo.setupData,
                  saltNonce: safeInfo.saltNonce,
                  version: safeInfo.version
                },
                preferences: {
                  label: 'Safe',
                  pfp: safe
                }
              }
            ]
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
  }, [goToNextRoute, addToast, accountsDispatch, t, safe, safeInfo, reset, isLoading])

  const getSplitAddress = (value: string) => {
    const addr = value.trim()
    // sometimes safe addresses come like eth:address
    // so we split it, if it has a :, and then we validate
    if (addr.indexOf(':') !== -1) {
      return addr.split(':')[1]!
    }
    return addr
  }

  const handleValidation = (value: string) => {
    const trimmedValue = getSplitAddress(value)

    if (!trimmedValue.length) return t('Field is required.')

    if (!isAddress(trimmedValue)) return t('Invalid address.')

    return undefined
  }

  useEffect(() => {
    const safeAddr = getSplitAddress(safeAddressValue)
    if (!safeAddr.length || !isAddress(safeAddr)) {
      setSafe('')
      return
    }

    if (safeAddr !== safe) setSafe(getAddress(safeAddr))
    if (safeAddr !== safe && safeAddr !== safeInfo?.address) {
      safeDispatch({ type: 'method', params: { method: 'findSafe', args: [safeAddr] } })
    }
  }, [safeDispatch, safeAddressValue, safeInfo?.address, safe])

  // run on unmount
  useEffect(() => {
    return () => {
      safeDispatch({ type: 'method', params: { method: 'resetFind', args: [] } })
    }
  }, [safeDispatch])

  const isSafeImported = useMemo(() => {
    return safe && safeInfo && accounts.find((a) => a.addr === safe)
  }, [safe, safeInfo, accounts])

  const btnText = useMemo(() => {
    if (isSafeImported) {
      return isLoading ? 'Proceeding...' : 'Proceed'
    }
    return isLoading ? 'Importing...' : 'Import'
  }, [isSafeImported, isLoading])

  return (
    <TabLayoutContainer backgroundColor={theme.secondaryBackground} header={<Header />}>
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
                            style={i === 0 ? { marginLeft: 0 } : { marginLeft: -11 }}
                            size={22}
                          />
                        ))}
                      </View>
                    </View>
                  )}

                  {isSafeImported && (
                    <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mt]}>
                      <SuccessIcon color={theme.successDecorative} width={20} height={20} />
                      <Text appearance="successText" style={spacings.mlTy}>
                        {t('Safe already imported')}
                      </Text>
                    </View>
                  )}

                  {safe && safeInfo && safeInfo.requiresModules && (
                    <View style={[flexbox.alignCenter, flexbox.justifyCenter, spacings.mt]}>
                      <Alert
                        type="warning"
                        text={t(
                          'To send transactions, this Safe account requires modules that are not implemented in Ambire. You can still import it as a view-only account.'
                        )}
                        style={{ maxWidth: '100%' }}
                      />
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
              text={`${t(btnText)}`}
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
