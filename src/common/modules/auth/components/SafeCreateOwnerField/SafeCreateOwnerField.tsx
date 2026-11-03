import React, { FC, useCallback } from 'react'
import { Control, Controller, UseFormSetValue, UseFormTrigger, useWatch } from 'react-hook-form'
import { View } from 'react-native'

import { AddressState, AddressStateOptional } from '@ambire-common/interfaces/domains'
import { Validation } from '@ambire-common/services/validations'
import DeleteIcon from '@common/assets/svg/DeleteIcon'
import AddressSelect from '@common/components/AddressSelect'
import { INPUT_WRAPPER_HEIGHT } from '@common/components/Input/styles'
import { useTranslation } from '@common/config/localization'
import useAddressInput from '@common/hooks/useAddressInput'
import useHover, { AnimatedPressable } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import { SafeCreateFormValues } from '@common/modules/auth/hooks/useSafeCreate'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Props {
  control: Control<SafeCreateFormValues>
  setValue: UseFormSetValue<SafeCreateFormValues>
  trigger: UseFormTrigger<SafeCreateFormValues>
  index: number
  /** Whether the field can be removed - the last remaining field can't */
  canRemove: boolean
  onRemove: (index: number) => void
  /** An owner entered in another field */
  overwriteValidation: Validation | null
  /** The owners entered in the other fields, left out of the list so they can't be picked twice */
  hiddenAddresses: string[]
  /** Shortens the owner addresses, for a container too narrow to fit a full one */
  withShortenedAddresses?: boolean
}

/**
 * The address field of one of the owners on the Safe create screen (web and mobile),
 * with a button to remove it when more than one owner is entered.
 */
const SafeCreateOwnerField: FC<Props> = ({
  control,
  setValue,
  trigger,
  index,
  canRemove,
  onRemove,
  overwriteValidation,
  hiddenAddresses,
  withShortenedAddresses
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const [bindRemoveAnim, removeAnimStyle] = useHover({ preset: 'opacityInverted' })
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
        <View style={[spacings.mbTy, flexbox.directionRow, flexbox.alignStart]}>
          <View style={flexbox.flex1}>
            <AddressSelect
              address={value}
              setAddress={onChange}
              validation={validation}
              resolvedAddress={addressState.resolvedAddress}
              resolvedAddressType={addressState.resolvedAddressType}
              isRecipientDomainResolving={addressState.isDomainResolving}
              bottomSheetTitle={t('Add Safe owner')}
              withShortenedAddresses={withShortenedAddresses}
              includeSelectedAccount
              hiddenAddresses={hiddenAddresses}
              // Every owner field would show it, so a valid owner looks like any other value
              isSuccessHidden
              // The parent has the same color as the default input background, so use the focused
              // input color to keep the input visible and the same before and after focus
              inputBackgroundColor={theme.tertiaryBackground}
            />
          </View>
          {canRemove && (
            <AnimatedPressable
              testID={`safe-create-remove-owner-field-${index}`}
              accessibilityLabel={t('Remove owner')}
              style={[
                removeAnimStyle,
                spacings.mlTy,
                flexbox.justifyCenter,
                { height: INPUT_WRAPPER_HEIGHT }
              ]}
              onPress={handleRemove}
              {...bindRemoveAnim}
            >
              <DeleteIcon width={24} height={24} />
            </AnimatedPressable>
          )}
        </View>
      )}
    />
  )
}

export default React.memo(SafeCreateOwnerField)
