import React, { FC, useCallback } from 'react'
import { Control, Controller, UseFormSetValue, UseFormTrigger, useWatch } from 'react-hook-form'
import { View } from 'react-native'

import { AddressState, AddressStateOptional } from '@ambire-common/interfaces/domains'
import { Validation } from '@ambire-common/services/validations'
import CloseIcon from '@common/assets/svg/CloseIcon'
import AddressSelect from '@common/components/AddressSelect'
import HoverablePressable from '@common/components/HoverablePressable'
import { INPUT_WRAPPER_HEIGHT } from '@common/components/Input/styles'
import { useTranslation } from '@common/config/localization'
import useAddressInput from '@common/hooks/useAddressInput'
import useTheme from '@common/hooks/useTheme'
import { SafeCreateFormValues } from '@common/modules/auth/hooks/useSafeCreate'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Props {
  control: Control<SafeCreateFormValues>
  setValue: UseFormSetValue<SafeCreateFormValues>
  trigger: UseFormTrigger<SafeCreateFormValues>
  index: number
  onRemove: (index: number) => void
  /** An owner entered in another field, or an address Safe refuses */
  overwriteValidation: Validation | null
  /** The owners entered in the other fields, left out of the list so they can't be picked twice */
  hiddenAddresses: string[]
}

const REMOVE_BUTTON_SIZE = 32

/**
 * The field of one of the owners on the Safe create screen (web and mobile): the same select
 * as a transfer's recipient, to pick one of the user's accounts or contacts, or to enter an
 * address or a domain. Next to it, a button to remove the owner.
 */
const SafeCreateOwnerField: FC<Props> = ({
  control,
  setValue,
  trigger,
  index,
  onRemove,
  overwriteValidation,
  hiddenAddresses
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const addressState = useWatch({ control, name: `owners.${index}` })

  const setAddressState = useCallback(
    (newState: AddressStateOptional) => {
      const addressStateEntries = Object.entries(newState) as [
        keyof AddressState,
        AddressState[keyof AddressState]
      ][]

      addressStateEntries.forEach(([key, value]) => {
        setValue(`owners.${index}.${key}`, value, {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true
        })
      })
    },
    [index, setValue]
  )
  const handleRevalidate = useCallback(() => {
    void trigger(`owners.${index}.fieldValue`)
  }, [index, trigger])

  const { validation, RHFValidate } = useAddressInput({
    addressState,
    setAddressState,
    overwriteValidation,
    handleRevalidate
  })

  const handleRemove = useCallback(() => onRemove(index), [index, onRemove])

  return (
    <Controller
      control={control}
      // An empty field is skipped on creation, so it is not an error
      rules={{ validate: (value) => !value.trim() || RHFValidate() }}
      name={`owners.${index}.fieldValue`}
      render={({ field: { onChange, value } }) => (
        <View style={[spacings.ptTy, flexbox.directionRow, flexbox.alignStart]}>
          <View style={flexbox.flex1}>
            <AddressSelect
              address={value}
              setAddress={onChange}
              validation={validation}
              resolvedAddress={addressState.resolvedAddress}
              resolvedAddressType={addressState.resolvedAddressType}
              isRecipientDomainResolving={addressState.isDomainResolving}
              bottomSheetTitle={t('Add owner')}
              // The owners card is too narrow to fit a full address
              withShortenedAddresses
              includeSelectedAccount
              hiddenAddresses={hiddenAddresses}
              // Every owner field would show it, so a valid owner looks like any other value
              isSuccessHidden
            />
          </View>
          <View style={[flexbox.justifyCenter, spacings.mlTy, { height: INPUT_WRAPPER_HEIGHT }]}>
            <HoverablePressable
              testID={`safe-create-remove-owner-field-${index}`}
              accessibilityLabel={t('Remove owner')}
              onPress={handleRemove}
              style={[
                flexbox.center,
                {
                  width: REMOVE_BUTTON_SIZE,
                  height: REMOVE_BUTTON_SIZE,
                  borderRadius: REMOVE_BUTTON_SIZE / 2,
                  // Sits on a card, so it's a shade lighter than it to stay visible
                  backgroundColor: theme.hoverBackground
                }
              ]}
            >
              <CloseIcon width={12} height={12} color={theme.iconPrimary} />
            </HoverablePressable>
          </View>
        </View>
      )}
    />
  )
}

export default React.memo(SafeCreateOwnerField)
