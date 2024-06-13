import React, { useCallback, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { AddressStateOptional } from '@ambire-common/interfaces/domains'
import AddressInput from '@common/components/AddressInput'
import Button from '@common/components/Button'
import Input from '@common/components/Input'
import useAddressInput from '@common/hooks/useAddressInput'
import spacings from '@common/styles/spacings'
import useAccountsControllerState from '@web/hooks/useAccountsControllerState'
import useAddressBookControllerState from '@web/hooks/useAddressBookControllerState'
import useBackgroundService from '@web/hooks/useBackgroundService'

import Section from '../Section'

const AddContactForm = () => {
  const { t } = useTranslation()
  const { dispatch } = useBackgroundService()
  const { contacts } = useAddressBookControllerState()
  const { accounts } = useAccountsControllerState()
  const {
    control,
    watch,
    setValue,
    handleSubmit,
    trigger,
    reset,
    formState: { isValid, isSubmitting, errors }
  } = useForm({
    mode: 'all',
    defaultValues: {
      name: '',
      addressState: {
        fieldValue: '',
        isDomainResolving: false,
        ensAddress: '',
        udAddress: ''
      }
    }
  })

  const name = watch('name')
  const addressState = watch('addressState')

  const setAddressState = useCallback(
    (newState: AddressStateOptional) => {
      Object.keys(newState).forEach((key) => {
        // @ts-ignore
        setValue(`addressState.${key}`, newState[key], {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true
        })
      })
    },
    [setValue]
  )

  const handleRevalidate = useCallback(() => {
    trigger('addressState.fieldValue')
  }, [trigger])

  const customValidation = useMemo(() => {
    const address = addressState.ensAddress || addressState.udAddress || addressState.fieldValue

    if (accounts.some((account) => account.addr.toLowerCase() === address.toLowerCase())) {
      return t('This address is already in your account list')
    }

    if (contacts.some((contact) => contact.address.toLowerCase() === address.toLowerCase())) {
      return t('This address is already in your address book')
    }

    return ''
  }, [
    accounts,
    addressState.ensAddress,
    addressState.fieldValue,
    addressState.udAddress,
    contacts,
    t
  ])

  const { validation, RHFValidate } = useAddressInput({
    addressState,
    setAddressState,
    handleRevalidate,
    overwriteError: customValidation
  })

  const submitForm = handleSubmit(() => {
    if (!isValid || isSubmitting) return

    dispatch({
      type: 'ADDRESS_BOOK_CONTROLLER_ADD_CONTACT',
      params: {
        name,
        address: addressState.ensAddress || addressState.udAddress || addressState.fieldValue
      }
    })

    reset()
  })

  return (
    <Section title="Add new Contact">
      <Controller
        name="name"
        control={control}
        rules={{
          required: true,
          maxLength: 32
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t('Name')}
            placeholder={t('Contact name')}
            maxLength={32}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.name?.message}
            isValid={!!name && !errors.name}
          />
        )}
      />
      <Controller
        name="addressState.fieldValue"
        control={control}
        rules={{
          validate: RHFValidate,
          required: true
        }}
        render={({ field: { onChange, onBlur } }) => (
          <AddressInput
            label={t('Address / ENS / Unstoppable domains')}
            onChangeText={onChange}
            onBlur={onBlur}
            validation={validation}
            udAddress={addressState.udAddress}
            ensAddress={addressState.ensAddress}
            value={addressState.fieldValue}
            isRecipientDomainResolving={addressState.isDomainResolving}
            containerStyle={spacings.mbLg}
            onSubmitEditing={submitForm}
          />
        )}
      />

      <Button
        text={t('Add to Address Book')}
        disabled={!isValid || isSubmitting}
        onPress={submitForm}
      />
    </Section>
  )
}

export default AddContactForm
