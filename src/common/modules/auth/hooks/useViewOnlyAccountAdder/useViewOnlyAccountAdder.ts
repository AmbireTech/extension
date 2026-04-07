import { getAddress } from 'ethers'
import { useCallback, useMemo, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'

import { AddressState } from '@ambire-common/interfaces/domains'
import { getDefaultAccountPreferences } from '@ambire-common/libs/account/account'
import { normalizeIdentityResponse } from '@ambire-common/libs/accountPicker/accountPicker'
import { getAddressFromAddressState } from '@ambire-common/utils/domains'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import { ROUTES } from '@common/modules/router/constants/common'

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
  namoshiAddress: '',
  isDomainResolving: false
}

export default function useViewOnlyAccountAdder() {
  const { state: accountsState, dispatch: accountsDispatch } = useController('AccountsController')
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { navigate } = useNavigation()
  const { theme } = useTheme()
  const { goToNextRoute, goToPrevRoute } = useOnboardingNavigation()

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
      const domainName = account.ensAddress || account.namoshiAddress ? account.fieldValue : null
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
      accountsDispatch({
        type: 'method',
        params: {
          method: 'addAccounts',
          args: [accountsToAdd]
        }
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
    accountsDispatch,
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

  return {
    control,
    watch,
    setValue,
    handleSubmit,
    trigger,
    fields,
    append,
    remove,
    disabled,
    buttonText,
    handleFormSubmit,
    isLoading,
    isSubmitting,
    duplicateAccountsIndexes,
    DEFAULT_ADDRESS_FIELD_VALUE
  }
}
