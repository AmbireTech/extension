import React, { useMemo } from 'react'
import { View } from 'react-native'

import { Hex } from '@ambire-common/interfaces/hex'
import AddCircularIcon from '@common/assets/svg/AddCircularIcon'
import AddIcon from '@common/assets/svg/AddIcon'
import Button from '@common/components/Button'
import HoverablePressable from '@common/components/HoverablePressable'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import SafeCreateOwnerField from '@common/modules/auth/components/SafeCreateOwnerField'
import useSafeCreate from '@common/modules/auth/hooks/useSafeCreate'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'

type Props = Omit<
  ReturnType<typeof useSafeCreate>,
  'goToPrevRoute' | 'isCreateButtonDisabled' | 'handleCreate'
> & {
  /** Shortens the owner addresses, for a container too narrow to fit a full one */
  withShortenedAddresses?: boolean
}

const SafeCreateForm = ({
  control,
  setValue,
  trigger,
  ownerFields,
  addOwnerField,
  removeOwnerField,
  ownerFieldValidations,
  ownerAddressesByField,
  ownersCount,
  requiredConfirmations,
  canDecreaseRequiredConfirmations,
  canIncreaseRequiredConfirmations,
  handleDecreaseRequiredConfirmations,
  handleIncreaseRequiredConfirmations,
  withShortenedAddresses
}: Props) => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)

  // Each field leaves out the owners entered in the other fields, but not its own
  const hiddenAddressesByField = useMemo(
    () =>
      ownerAddressesByField.map((_, index) =>
        ownerAddressesByField.filter(
          (address, otherIndex): address is Hex => !!address && otherIndex !== index
        )
      ),
    [ownerAddressesByField]
  )

  const confirmationsDescription = useMemo(() => {
    if (!ownersCount) return t('Add an owner to set this')
    if (ownersCount === 1) return t('The only owner must approve')

    const translationParams = { requiredConfirmations, ownersCount }
    if (requiredConfirmations === ownersCount)
      return t(
        'All {{requiredConfirmations}} of {{ownersCount}} owners must approve',
        translationParams
      )

    return t(
      'Any {{requiredConfirmations}} of {{ownersCount}} owners must approve',
      translationParams
    )
  }, [ownersCount, requiredConfirmations, t])

  return (
    <View>
      <Text fontSize={18} weight="semiBold" style={spacings.mbSm}>
        {t('Owners')}
      </Text>
      {ownerFields.map((field, index) => (
        <SafeCreateOwnerField
          key={field.id}
          control={control}
          setValue={setValue}
          trigger={trigger}
          index={index}
          canRemove={ownerFields.length > 1}
          onRemove={removeOwnerField}
          overwriteValidation={ownerFieldValidations[index] ?? null}
          hiddenAddresses={hiddenAddressesByField[index] ?? []}
          withShortenedAddresses={withShortenedAddresses}
        />
      ))}
      <Button
        type="outline"
        testID="safe-create-add-owner"
        style={{ height: 40 }}
        size="tiny"
        onPress={addOwnerField}
        childrenPosition="left"
        text={t('Add another owner')}
        hasBottomSpacing={false}
      >
        <AddCircularIcon width={20} height={20} color={theme.primaryText} style={spacings.mrMi} />
      </Button>

      <View style={styles.confirmationsSection}>
        {/* The stepper shares a line with the title, so it stays put when the description wraps */}
        <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mbSm]}>
          <Text fontSize={18} weight="semiBold" style={[flexbox.flex1, spacings.mrSm]}>
            {t('Required confirmations')}
          </Text>
          <View style={[flexbox.directionRow, flexbox.alignCenter]}>
            <HoverablePressable
              onPress={handleDecreaseRequiredConfirmations}
              disabled={!canDecreaseRequiredConfirmations}
              style={[
                styles.stepperButton,
                !canDecreaseRequiredConfirmations && styles.stepperButtonDisabled
              ]}
              accessibilityLabel={t('Decrease required confirmations')}
              testID="safe-create-decrease-confirmations"
            >
              {/* There is no minus icon in src/common/assets/svg, so a text minus sign stands in for it */}
              <Text appearance="primary" style={styles.minusSign}>
                −
              </Text>
            </HoverablePressable>
            <Text
              fontSize={16}
              weight="semiBold"
              style={styles.stepperValue}
              testID="safe-create-required-confirmations"
            >
              {requiredConfirmations}
            </Text>
            <HoverablePressable
              onPress={handleIncreaseRequiredConfirmations}
              disabled={!canIncreaseRequiredConfirmations}
              style={[
                styles.stepperButton,
                !canIncreaseRequiredConfirmations && styles.stepperButtonDisabled
              ]}
              accessibilityLabel={t('Increase required confirmations')}
              testID="safe-create-increase-confirmations"
            >
              <AddIcon width={18} height={18} color={theme.primary} />
            </HoverablePressable>
          </View>
        </View>
        <Text fontSize={14} appearance="secondaryText">
          {confirmationsDescription}
        </Text>
      </View>
    </View>
  )
}

export default React.memo(SafeCreateForm)
