import { getAddress } from 'ethers'
import React, { useCallback, useMemo, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { ScrollView, View } from 'react-native'

import { AddressState } from '@ambire-common/interfaces/domains'
import { getDefaultAccountPreferences } from '@ambire-common/libs/account/account'
import { normalizeIdentityResponse } from '@ambire-common/libs/accountPicker/accountPicker'
import { getAddressFromAddressState } from '@ambire-common/utils/domains'
import Button from '@common/components/Button'
import Panel from '@common/components/Panel'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import Header from '@common/modules/header/components/Header'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { TabLayoutContainer, TabLayoutWrapperMainContent } from '@web/components/TabLayoutWrapper'
import useAccountsControllerState from '@web/hooks/useAccountsControllerState'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useHover, { AnimatedPressable } from '@web/hooks/useHover'

import AddressField from './AddressField'

const getDuplicateAccountIndexes = (accounts: AddressState[]) => {
  const accountAddresses = accounts.map((addressState) => {
    return getAddressFromAddressState(addressState).toLowerCase()
  })

  const duplicates: number[] = []

  accountAddresses.forEach((address, index) => {
    if (address.trim() === '') return

    if (accountAddresses.indexOf(address.toLowerCase()) !== index && !duplicates.includes(index)) {
      duplicates.push(index, accountAddresses.indexOf(address.toLowerCase()))
    }
  })
  return duplicates
}

const DEFAULT_ADDRESS_FIELD_VALUE = {
  fieldValue: '',
  ensAddress: '',
  isDomainResolving: false
}

const ViewOnlyScreen = () => {
  const { dispatch } = useBackgroundService()
  const accountsState = useAccountsControllerState()
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { navigate } = useNavigation()
  const { theme } = useTheme()
  const { goToNextRoute, goToPrevRoute } = useOnboardingNavigation()
  const [bindAnim, animStyle] = useHover({
    preset: 'opacityInverted'
  })
  const [isLoading, setIsLoading] = useState(false)
  const {
    control,
    watch,
    setValue,
    handleSubmit,
    trigger,
    formState: { isValid: perhapsUselessIsValid, errors, isSubmitting }
  } = useForm({
    mode: 'all',
    defaultValues: {
      accounts: [{ ...DEFAULT_ADDRESS_FIELD_VALUE }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'accounts'
  })
  const accounts = watch('accounts')

  const duplicateAccountsIndexes = getDuplicateAccountIndexes(accounts)

  const isValid = useMemo(() => {
    return !errors.accounts?.length && perhapsUselessIsValid
  }, [perhapsUselessIsValid, errors.accounts?.length])

  const disabled = useMemo(
    () => !isValid || isSubmitting || isLoading || duplicateAccountsIndexes.length > 0,
    [duplicateAccountsIndexes.length, isLoading, isSubmitting, isValid]
  )

  const isEveryAccountImported = useMemo(
    () =>
      isValid &&
      accounts.length &&
      accounts.every((account) =>
        accountsState.accounts.some(
          (existingAccount) =>
            existingAccount.addr.toLowerCase() === getAddressFromAddressState(account).toLowerCase()
        )
      ),
    [accounts, accountsState.accounts, isValid]
  )

  const handleFormSubmit = useCallback(async () => {
    if (isEveryAccountImported) {
      navigate(ROUTES.dashboard)
      return
    }

    const accountsToAdd = accounts.map((account, i) => {
      const address = getAddressFromAddressState(account)
      // Use defaults, fetch identity later so account import isn’t blocked by failures
      const identityDefaults = normalizeIdentityResponse(address)
      const { creation, initialPrivileges, associatedKeys } = identityDefaults

      const addr = getAddress(address)
      const domainName = account.ensAddress ? account.fieldValue : null
      return {
        addr,
        associatedKeys,
        initialPrivileges,
        creation,
        // account.fieldValue is the domain name if it's an ENS address
        domainName,
        preferences: {
          label: domainName || getDefaultAccountPreferences(addr, accountsState.accounts, i).label,
          pfp: addr
        }
      }
    })

    try {
      setIsLoading(true)
      dispatch({
        type: 'MAIN_CONTROLLER_ADD_VIEW_ONLY_ACCOUNTS',
        params: { accounts: accountsToAdd }
      })
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
  }, [
    isEveryAccountImported,
    accounts,
    navigate,
    accountsState.accounts,
    dispatch,
    goToNextRoute,
    addToast,
    t
  ])

  const buttonText = useMemo(() => {
    if (isEveryAccountImported) {
      return t('Continue')
    }

    return isLoading ? t('Importing...') : t('Import')
  }, [isEveryAccountImported, isLoading, t])

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
          title={t('Import a view-only address')}
          step={1}
          totalSteps={2}
        >
          <View style={[flexbox.justifySpaceBetween, flexbox.flex1]}>
            <ScrollView style={spacings.mbLg}>
              <View>
                {fields.map((field, index) => (
                  <AddressField
                    duplicateAccountsIndexes={duplicateAccountsIndexes}
                    key={field.id}
                    control={control}
                    index={index}
                    remove={remove}
                    isLoading={isLoading || isSubmitting}
                    handleSubmit={handleSubmit(handleFormSubmit)}
                    disabled={disabled}
                    field={field}
                    watch={watch}
                    setValue={setValue}
                    trigger={trigger}
                  />
                ))}
                <AnimatedPressable
                  testID="add-one-more-address"
                  disabled={isSubmitting}
                  onPress={() => append({ ...DEFAULT_ADDRESS_FIELD_VALUE })}
                  style={[spacings.ptTy, animStyle]}
                  {...bindAnim}
                >
                  <Text fontSize={14} underline appearance="secondaryText">
                    {t('+ Add another address')}
                  </Text>
                </AnimatedPressable>
              </View>
            </ScrollView>
            <Button
              testID="view-only-button-import"
              size="large"
              disabled={disabled}
              hasBottomSpacing={false}
              text={buttonText}
              onPress={handleSubmit(handleFormSubmit)}
            />
          </View>
        </Panel>
      </TabLayoutWrapperMainContent>
    </TabLayoutContainer>
  )
}

export default React.memo(ViewOnlyScreen)
