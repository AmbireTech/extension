import React, { FC, useCallback, useMemo } from 'react'
import { Controller, UseFormSetValue, UseFormTrigger, UseFormWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { AddressStateOptional } from '@ambire-common/interfaces/domains'
import { getAddressFromAddressState } from '@ambire-common/utils/domains'
import shortenAddress from '@ambire-common/utils/shortenAddress'
import DeleteIcon from '@common/assets/svg/DeleteIcon'
import AddressInput from '@common/components/AddressInput'
import Banner from '@common/components/Banner/Banner'
import useAddressInput from '@common/hooks/useAddressInput'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import useAccountsControllerState from '@web/hooks/useAccountsControllerState'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useKeystoreControllerState from '@web/hooks/useKeystoreControllerState'

interface Props {
  duplicateAccountsIndexes: number[]
  field: any
  index: number
  watch: UseFormWatch<any>
  control: any
  isLoading: boolean
  handleSubmit: () => void
  remove: (index: number) => void
  disabled: boolean
  setValue: UseFormSetValue<any>
  trigger: UseFormTrigger<any>
}

const AddressField: FC<Props> = ({
  duplicateAccountsIndexes,
  field,
  index,
  watch,
  control,
  isLoading,
  handleSubmit,
  remove,
  disabled,
  setValue,
  trigger
}) => {
  const { dispatch } = useBackgroundService()
  const accountsState = useAccountsControllerState()
  const keystoreState = useKeystoreControllerState()
  const accounts = watch('accounts')
  const value = watch(`accounts.${index}`)
  const { t } = useTranslation()

  const setAddressState = useCallback(
    (newState: AddressStateOptional) => {
      Object.keys(newState).forEach((key) => {
        // @ts-ignore
        setValue(`accounts.${index}.${key}`, newState[key], {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true
        })
      })
    },
    [index, setValue]
  )

  // Check if the address being entered is already linked to existing keys
  // This helps inform users that the address will be added with full access instead of view-only
  const addressesInAssociatedKeys = useMemo(() => {
    const currentAddress = value?.fieldValue?.toLowerCase()
    if (!currentAddress) return []
    // Already handled in another validation (account already imported)
    if (accountsState.accounts.find((account) => account.addr.toLowerCase() === currentAddress))
      return []

    // Find accounts that have the current address in their associated keys
    // but only if the address also exists in the keystore (meaning we have the private key)
    const addressesWithSharedKey = accountsState.accounts
      .filter((account) => {
        // Check if this address exists in keystore (we have the private key)
        const addressInKeystore = keystoreState.keys.some(
          (key) => key.addr?.toLowerCase() === currentAddress
        )

        // Check if this address is associated with the current account
        const isAssociatedWithAccount = (account.associatedKeys || []).some(
          (key) => key?.toLowerCase() === currentAddress
        )

        return isAssociatedWithAccount && addressInKeystore
      })
      .map((account) => account.addr)

    return [...new Set(addressesWithSharedKey)]
  }, [accountsState.accounts, keystoreState.keys, value?.fieldValue])

  const overwriteError = useMemo(() => {
    // We don't want to update the error message while accounts are being
    // imported because that would stop the import process.
    if (isLoading) return ''

    if (
      accountsState.accounts.find(
        (account) => account.addr.toLowerCase() === getAddressFromAddressState(value).toLowerCase()
      )
    )
      return 'This address is already in your wallet.'

    if (duplicateAccountsIndexes.includes(index)) return 'Duplicate address.'

    return ''
  }, [duplicateAccountsIndexes, index, isLoading, accountsState.accounts, value])

  const handleRevalidate = useCallback(() => {
    // We don't want to update the error message while accounts are being
    // imported because that would stop the import process.
    if (isLoading) return
    trigger(`accounts.${index}.fieldValue`)
  }, [index, isLoading, trigger])

  const handleCacheResolvedDomain = useCallback(
    (address: string, ensAvatar: string | null, domain: string, type: 'ens') => {
      dispatch({
        type: 'DOMAINS_CONTROLLER_SAVE_RESOLVED_REVERSE_LOOKUP',
        params: {
          type,
          address,
          name: domain,
          ensAvatar
        }
      })
    },
    [dispatch]
  )

  const { validation, RHFValidate } = useAddressInput({
    addressState: value,
    setAddressState,
    overwriteError,
    handleRevalidate,
    handleCacheResolvedDomain
  })

  return (
    <Controller
      key={field.id}
      control={control}
      rules={{
        validate: RHFValidate,
        required: true
      }}
      render={({ field: { onChange, onBlur } }) => (
        <View>
          <View style={[spacings.mbTy, flexbox.directionRow, flexbox.alignCenter]}>
            <AddressInput
              testID={`view-only-address-field-${index}`}
              validation={validation}
              containerStyle={{ ...spacings.mb0, ...flexbox.flex1 }}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value.fieldValue}
              autoFocus
              disabled={isLoading}
              ensAddress={value.ensAddress}
              isRecipientDomainResolving={value.isDomainResolving}
              onSubmitEditing={disabled ? undefined : handleSubmit}
              button={accounts.length > 1 ? <DeleteIcon /> : null}
              onButtonPress={() => remove(index)}
            />
          </View>
          {addressesInAssociatedKeys?.length > 0 &&
            addressesInAssociatedKeys.map((_address) => {
              return (
                <Banner
                  title={t('This account’s key is already imported.')}
                  text={t(
                    `It’s the same key associated with ${shortenAddress(
                      _address,
                      13
                    )}. If you continue, this address will be linked to that key and managed with full access, not as view-only.`
                  )}
                  type="info2"
                  key={_address}
                />
              )
            })}
        </View>
      )}
      name={`accounts.${index}.fieldValue`}
    />
  )
}

export default AddressField
