import React, { useCallback, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { Modalize } from 'react-native-modalize'

import { AddressStateOptional } from '@ambire-common/interfaces/domains'
import { Validation } from '@ambire-common/services/validations'
import { getAddressFromAddressState } from '@ambire-common/utils/domains'
import AddressInput from '@common/components/AddressInput'
import BottomSheet from '@common/components/BottomSheet'
import DualChoiceModal from '@common/components/DualChoiceModal'
import Input from '@common/components/Input'
import useAddressInput from '@common/hooks/useAddressInput'
import useController from '@common/hooks/useController'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  id: string
  sheetRef: React.RefObject<Modalize>
  closeBottomSheet: () => void
}

const AddContactFormModal = ({ id, sheetRef, closeBottomSheet }: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { dispatch } = useControllersMiddleware()
  const { contacts } = useController('AddressBookController').state
  const { accounts } = useController('AccountsController').state

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
        resolvedAddress: '',
        resolvedAddressType: null
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
    trigger('addressState.resolvedAddress')
    trigger('addressState.resolvedAddressType')
  }, [trigger])

  const overwriteValidation: Validation | null = useMemo(() => {
    const address = getAddressFromAddressState(addressState)

    if (accounts.some((account) => account.addr.toLowerCase() === address.toLowerCase())) {
      return {
        severity: 'error',
        message: t('This address is already in your account list')
      }
    }

    if (contacts.some((contact) => contact.address.toLowerCase() === address.toLowerCase())) {
      return {
        severity: 'error',
        message: t('This address is already in your Address Book')
      }
    }

    return null
  }, [accounts, addressState, contacts, t])

  const { validation, RHFValidate } = useAddressInput({
    addressState,
    setAddressState,
    handleRevalidate,
    overwriteValidation
  })

  const submitForm = handleSubmit(() => {
    if (!isValid || isSubmitting) return

    dispatch({
      type: 'ADDRESS_BOOK_CONTROLLER_ADD_CONTACT',
      params: {
        name,
        address: getAddressFromAddressState(addressState)
      }
    })

    reset()
    closeBottomSheet()
  })

  const handleClose = useCallback(() => {
    reset()
    closeBottomSheet()
  }, [closeBottomSheet, reset])

  return (
    <BottomSheet
      id={id}
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
      type="modal"
      style={{ ...spacings.ph0, ...spacings.pv0 }}
    >
      <DualChoiceModal
        title={t('Add new contact')}
        style={flexbox.flex1}
        description={
          <>
            <Controller
              name="name"
              control={control}
              rules={{
                required: true,
                maxLength: 32
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  testID="contact-name-field"
                  label={t('Name')}
                  placeholder={t('Contact name')}
                  maxLength={32}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.name?.message}
                  isValid={!!name && !errors.name}
                  backgroundColor={theme.secondaryBackground}
                  containerStyle={{ width: '100%', ...spacings.mb }}
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
                <View style={{ width: '100%' }}>
                  <AddressInput
                    label={t('Address / ENS')}
                    onChangeText={(text) => {
                      onChange(text)
                      trigger('addressState.fieldValue')
                    }}
                    onBlur={onBlur}
                    validation={validation}
                    resolvedAddress={addressState.resolvedAddress}
                    resolvedAddressType={addressState.resolvedAddressType}
                    value={addressState.fieldValue}
                    isRecipientDomainResolving={addressState.isDomainResolving}
                    containerStyle={{ ...spacings.mbLg, width: '100%' }}
                    onSubmitEditing={submitForm}
                    backgroundColor={theme.secondaryBackground}
                  />
                </View>
              )}
            />
          </>
        }
        primaryButtonText={t('+ Add to Address Book')}
        primaryButtonTestID="add-to-address-book-button"
        onPrimaryButtonPress={submitForm}
        secondaryButtonTestID="cancel-add-to-address-book-button"
        secondaryButtonText={t('Cancel')}
        onSecondaryButtonPress={handleClose}
        buttonsContainerStyle={flexbox.justifySpaceBetween}
        primaryButtonDisabled={!isValid || isSubmitting}
      />
    </BottomSheet>
  )
}

export default AddContactFormModal
