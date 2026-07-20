import React, { useCallback } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { Modalize } from 'react-native-modalize'

import { AddressStateOptional } from '@ambire-common/interfaces/domains'
import { getAddressFromAddressState } from '@ambire-common/utils/domains'
import AddCircularIcon from '@common/assets/svg/AddCircularIcon'
import AddressInput from '@common/components/AddressInput'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import DualChoiceModal from '@common/components/DualChoiceModal'
import Input from '@common/components/Input'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import useAddressInput from '@common/hooks/useAddressInput'
import useController from '@common/hooks/useController'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

type Props = {
  id: string
  sheetRef: React.RefObject<Modalize>
  closeBottomSheet: () => void
}

const AddContactFormModal = ({ id, sheetRef, closeBottomSheet }: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { addToast } = useToast()
  const { dispatch } = useControllersMiddleware()
  const { contacts } = useController('AddressBookController').state
  const { accounts } = useController('AccountsController').state
  const { verifiedDomainsStatus } = useController('DomainsController').state

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
  const isDomainVerifiedByColibri =
    verifiedDomainsStatus[addressState.fieldValue.trim()] === 'VERIFIED'

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

  const { validation, RHFValidate } = useAddressInput({
    addressState,
    setAddressState,
    handleRevalidate,
    isDomainVerifiedByColibri
  })

  const submitForm = handleSubmit(() => {
    if (!isValid || isSubmitting) return

    const address = getAddressFromAddressState(addressState)
    // `contacts` excludes the selected account, so also check `accounts` to catch it
    const isAlreadyAdded =
      accounts.some((account) => account.addr.toLowerCase() === address.toLowerCase()) ||
      contacts.some((contact) => contact.address.toLowerCase() === address.toLowerCase())

    if (isAlreadyAdded) {
      addToast(t('Contact already added'))
      reset()
      closeBottomSheet()
      return
    }

    dispatch({
      type: 'ADDRESS_BOOK_CONTROLLER_ADD_CONTACT',
      params: {
        name,
        address
      }
    })
    addToast(t('Contact added'))

    reset()
    closeBottomSheet()
  })

  const handleClose = useCallback(() => {
    reset()
    closeBottomSheet()
  }, [closeBottomSheet, reset])

  const formFields = (
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
            placeholder={' '}
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
              label={t('Address / ENS / GNS / Namoshi')}
              onChangeText={(text) => {
                onChange(text)
                trigger('addressState.fieldValue')
              }}
              onScanAddress={(scannedAddress) => {
                onChange(scannedAddress)
                trigger('addressState.fieldValue')
              }}
              onBlur={onBlur}
              validation={validation}
              placeholder={' '}
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
  )

  return (
    <BottomSheet
      id={id}
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
      type={isWeb ? 'modal' : 'bottom-sheet'}
      style={isWeb ? { ...spacings.ph0, ...spacings.pv0 } : {}}
    >
      {isWeb ? (
        <DualChoiceModal
          title={t('Add new contact')}
          style={flexbox.flex1}
          description={formFields}
          primaryButtonText={t('+ Add to Address Book')}
          primaryButtonTestID="add-to-address-book-button"
          onPrimaryButtonPress={submitForm}
          secondaryButtonTestID="cancel-add-to-address-book-button"
          secondaryButtonText={t('Cancel')}
          onSecondaryButtonPress={handleClose}
          buttonsContainerStyle={flexbox.justifySpaceBetween}
          primaryButtonDisabled={!isValid || isSubmitting}
        />
      ) : (
        <View>
          <Text weight="medium" fontSize={20} style={[spacings.mbLg, text.center]}>
            {t('Add new contact')}
          </Text>
          {formFields}
          <Button
            testID="add-to-address-book-button"
            text={t('Add to Address Book')}
            onPress={submitForm}
            size="large"
            childrenPosition="left"
            hasBottomSpacing={false}
            disabled={!isValid || isSubmitting}
            style={spacings.mbSm}
          >
            <AddCircularIcon width={24} height={24} color="#fff" style={spacings.mrTy} />
          </Button>
          <Button
            testID="cancel-add-to-address-book-button"
            text={t('Cancel')}
            onPress={handleClose}
            type="tertiary"
            size="large"
            hasBottomSpacing={false}
          />
        </View>
      )}
    </BottomSheet>
  )
}

export default AddContactFormModal
