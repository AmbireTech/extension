import React, { FC } from 'react'
import { Control } from 'react-hook-form'

import AddCircularIcon from '@common/assets/svg/AddCircularIcon'
import Button from '@common/components/Button'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import PrivateKeyImportField from '@common/modules/auth/components/PrivateKeyImportField'
import spacings from '@common/styles/spacings'

interface Props {
  control: Control<{ privateKeys: { value: string }[] }>
  fields: { id: string }[]
  /** What to show under each field, in the same order as `fields` */
  fieldStates: { error?: string; info?: string; isValid: boolean }[]
  canAddMore: boolean
  onAdd: () => void
  onRemove: (index: number) => void
  handleValidation: (value: string) => string | undefined
  onSubmitEditing: () => void
}

/**
 * The list of private key fields on the private key import screen (web and mobile),
 * followed by the button that adds another field.
 */
const PrivateKeyImportFields: FC<Props> = ({
  control,
  fields,
  fieldStates,
  canAddMore,
  onAdd,
  onRemove,
  handleValidation,
  onSubmitEditing
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()

  return (
    <>
      {fields.map((field, index) => (
        <PrivateKeyImportField
          key={field.id}
          control={control}
          index={index}
          canRemove={fields.length > 1}
          onRemove={onRemove}
          handleValidation={handleValidation}
          error={fieldStates[index]?.error}
          info={fieldStates[index]?.info}
          isValid={!!fieldStates[index]?.isValid}
          onSubmitEditing={onSubmitEditing}
        />
      ))}
      <Button
        type="outline"
        testID="add-one-more-private-key"
        disabled={!canAddMore}
        style={{ height: 40 }}
        size="tiny"
        onPress={onAdd}
        childrenPosition="left"
        text={t('Add another private key')}
        hasBottomSpacing={false}
      >
        <AddCircularIcon width={20} height={20} color={theme.primaryText} style={spacings.mrMi} />
      </Button>
    </>
  )
}

export default React.memo(PrivateKeyImportFields)
