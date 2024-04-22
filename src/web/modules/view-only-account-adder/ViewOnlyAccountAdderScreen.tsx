import { getAddress } from 'ethers'
import React, { useCallback, useEffect, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { View } from 'react-native'

import { AddressState } from '@ambire-common/interfaces/domains'
import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import BackButton from '@common/components/BackButton'
import Button from '@common/components/Button'
import Panel from '@common/components/Panel'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import Header from '@common/modules/header/components/Header'
import { ROUTES, WEB_ROUTES } from '@common/modules/router/constants/common'
import { fetchCaught } from '@common/services/fetch'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import { getAddressFromAddressState } from '@common/utils/domains'
import { RELAYER_URL } from '@env'
import { TabLayoutContainer, TabLayoutWrapperMainContent } from '@web/components/TabLayoutWrapper'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useHover, { AnimatedPressable } from '@web/hooks/useHover'
import useMainControllerState from '@web/hooks/useMainControllerState'
import useSettingsControllerState from '@web/hooks/useSettingsControllerState'

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
  udAddress: '',
  isDomainResolving: false
}

const ViewOnlyScreen = () => {
  const { navigate } = useNavigation()
  const { dispatch } = useBackgroundService()
  const mainControllerState = useMainControllerState()
  const settingsControllerState = useSettingsControllerState()
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { theme } = useTheme()
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
    formState: { isValid, isSubmitting }
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

  const handleFormSubmit = useCallback(async () => {
    const accountsToAddPromises = accounts.map(async (account) => {
      const address = getAddressFromAddressState(account)
      // Use `fetchCaught` because the endpoint could return 404 if the account
      // is not found, which should not throw an error
      const accountIdentityResponse = await fetchCaught(`${RELAYER_URL}/v2/identity/${address}`)

      // Trick to determine if there is an error throw. When the request 404s,
      // there is no error message incoming, which is enough to treat it as a
      // no-error, 404 response is expected for EOAs.
      if (accountIdentityResponse?.errMsg) throw new Error(accountIdentityResponse.errMsg)

      const accountIdentity: any = accountIdentityResponse?.body
      let creation = null
      let associatedKeys = [address]
      if (
        typeof accountIdentity === 'object' &&
        accountIdentity !== null &&
        'identityFactoryAddr' in accountIdentity &&
        typeof accountIdentity.identityFactoryAddr === 'string' &&
        'bytecode' in accountIdentity &&
        typeof accountIdentity.bytecode === 'string' &&
        'salt' in accountIdentity &&
        typeof accountIdentity.salt === 'string'
      ) {
        creation = {
          factoryAddr: accountIdentity.identityFactoryAddr,
          bytecode: accountIdentity.bytecode,
          salt: accountIdentity.salt
        }
      }

      if (accountIdentity?.associatedKeys) {
        associatedKeys = Object.keys(accountIdentity?.associatedKeys || {})
      }

      return {
        addr: getAddress(address),
        associatedKeys,
        initialPrivileges: accountIdentity?.initialPrivileges || [],
        creation,
        // account.fieldValue is the domain name if it's an ENS/UD address
        domainName: account.ensAddress || account.udAddress ? account.fieldValue : null
      }
    })

    try {
      const accountsToAdd = await Promise.all(accountsToAddPromises)
      setIsLoading(true)
      return dispatch({
        type: 'MAIN_CONTROLLER_ADD_VIEW_ONLY_ACCOUNTS',
        params: { accounts: accountsToAdd }
      })
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
  }, [accounts, addToast, dispatch, t])

  useEffect(() => {
    // Prevents navigating when user is in the middle of adding accounts,
    // user adds account that is not valid and clicks "+ add one more address".
    // This use effect gets triggered, because the `accounts` change.
    if (!isValid) return
    if (duplicateAccountsIndexes.length > 0) return

    const newAccountsAddresses = accounts.map((account) =>
      getAddressFromAddressState(account).toLowerCase()
    )
    const newAccountsAdded = mainControllerState.accounts.filter((account) =>
      newAccountsAddresses.includes(account.addr.toLowerCase())
    )
    const newAccountsDefaultPreferencesImported = Object.keys(
      settingsControllerState.accountPreferences
    ).some((accountAddr) => newAccountsAddresses.includes(accountAddr.toLowerCase()))

    // Navigate when the new accounts and their default preferences are imported,
    // indicating the final step for the view-only account adding flow completes.
    if (newAccountsAdded.length && newAccountsDefaultPreferencesImported) {
      setIsLoading(false)
      navigate(WEB_ROUTES.accountPersonalize, {
        state: { accounts: newAccountsAdded }
      })
    }
  }, [
    accounts,
    dispatch,
    duplicateAccountsIndexes.length,
    isValid,
    mainControllerState.accounts,
    navigate,
    settingsControllerState.accountPreferences
  ])

  const disabled = !isValid || isSubmitting || isLoading || duplicateAccountsIndexes.length > 0

  return (
    <TabLayoutContainer
      backgroundColor={theme.secondaryBackground}
      width="md"
      header={<Header withAmbireLogo />}
      footer={
        <>
          <BackButton fallbackBackRoute={ROUTES.getStarted} />
          <Button
            textStyle={{ fontSize: 14 }}
            size="large"
            disabled={disabled}
            hasBottomSpacing={false}
            text={isSubmitting ? t('Importing...') : t('Import')}
            onPress={handleSubmit(handleFormSubmit)}
          >
            <View style={spacings.pl}>
              <RightArrowIcon color={colors.titan} />
            </View>
          </Button>
        </>
      }
    >
      <TabLayoutWrapperMainContent>
        <Panel title={t('Import A Wallet In View-Only Mode')}>
          {fields.map((field, index) => (
            <AddressField
              duplicateAccountsIndexes={duplicateAccountsIndexes}
              key={field.id}
              control={control}
              index={index}
              remove={remove}
              isSubmitting={isSubmitting}
              handleSubmit={handleSubmit(handleFormSubmit)}
              disabled={disabled}
              field={field}
              watch={watch}
              setValue={setValue}
              trigger={trigger}
            />
          ))}
          <View>
            <AnimatedPressable
              disabled={isSubmitting}
              onPress={() => append({ ...DEFAULT_ADDRESS_FIELD_VALUE })}
              style={[spacings.ptTy, animStyle]}
              {...bindAnim}
            >
              <Text fontSize={14} underline>
                {t('+ Add one more address')}
              </Text>
            </AnimatedPressable>
          </View>
        </Panel>
      </TabLayoutWrapperMainContent>
    </TabLayoutContainer>
  )
}

export default React.memo(ViewOnlyScreen)
