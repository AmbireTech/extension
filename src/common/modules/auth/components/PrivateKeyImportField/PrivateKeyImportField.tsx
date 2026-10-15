import React, { FC, useCallback } from 'react'
import { Control, Controller } from 'react-hook-form'
import { View } from 'react-native'

import DeleteIcon from '@common/assets/svg/DeleteIcon'
import Input from '@common/components/Input'
import { INPUT_WRAPPER_HEIGHT } from '@common/components/Input/styles'
import { useTranslation } from '@common/config/localization'
import { NO_AUTOFILL_PROPS } from '@common/constants/textInput'
import useHover, { AnimatedPressable } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Props {
  control: Control<{ privateKeys: { value: string }[] }>
  index: number
  /** Whether the field can be removed - the last remaining field can't */
  canRemove: boolean
  onRemove: (index: number) => void
  handleValidation: (value: string) => string | undefined
  getPrivateKeyError: (index: number) => string | undefined
  onSubmitEditing: () => void
}

/**
 * A masked input for one of the private keys on the private key import screen,
 * with a button to remove it when more than one key is entered.
 */
const PrivateKeyImportField: FC<Props> = ({
  control,
  index,
  canRemove,
  onRemove,
  handleValidation,
  getPrivateKeyError,
  onSubmitEditing
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const [bindRemoveAnim, removeAnimStyle] = useHover({ preset: 'opacityInverted' })

  const handleRemove = useCallback(() => onRemove(index), [index, onRemove])

  return (
    <Controller
      control={control}
      rules={{ validate: (value) => handleValidation(value), required: true }}
      name={`privateKeys.${index}.value`}
      render={({ field: { onChange, onBlur, value } }) => (
        <View style={[spacings.mbTy, flexbox.directionRow, flexbox.alignStart]}>
          <Input
            {...NO_AUTOFILL_PROPS}
            // The first field keeps the original ID, which the e2e tests rely on
            testID={index === 0 ? 'enter-private-key-field' : `enter-private-key-field-${index}`}
            onBlur={onBlur}
            autoFocus
            placeholder={t('Input private key')}
            onChangeText={onChange}
            value={value}
            isValid={!!value.length && !handleValidation(value) && !getPrivateKeyError(index)}
            validLabel={t('✅ Valid private key')}
            secureTextEntry
            containerStyle={{ ...spacings.mb0, ...flexbox.flex1 }}
            backgroundColor={theme.secondaryBackground}
            error={value.length ? getPrivateKeyError(index) : ''}
            autoCorrect={false}
            onSubmitEditing={onSubmitEditing}
          />
          {canRemove && (
            <AnimatedPressable
              testID={`remove-private-key-field-${index}`}
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

export default React.memo(PrivateKeyImportField)
