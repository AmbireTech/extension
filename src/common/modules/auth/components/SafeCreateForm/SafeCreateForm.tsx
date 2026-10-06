import React, { useCallback, useMemo } from 'react'
import { Controller } from 'react-hook-form'
import { View } from 'react-native'

import { Hex } from '@ambire-common/interfaces/hex'
import AddIcon from '@common/assets/svg/AddIcon'
import CloseIcon from '@common/assets/svg/CloseIcon'
import AddressBookContact from '@common/components/AddressBookContact'
import AddressSelect from '@common/components/AddressSelect'
import Button from '@common/components/Button'
import HoverablePressable from '@common/components/HoverablePressable'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import useSafeCreate, { SafeCreateOwner } from '@common/modules/auth/hooks/useSafeCreate'
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

const SHORTENED_ADDRESS_MAX_LENGTH = 16

const OwnerRow = React.memo(
  ({
    owner,
    withShortenedAddresses,
    withDivider,
    onRemove
  }: {
    owner: SafeCreateOwner
    withShortenedAddresses?: boolean
    /** Draws a line below the row, to separate it from the next owner */
    withDivider: boolean
    onRemove: (address: Hex) => void
  }) => {
    const { t } = useTranslation()
    const { styles, theme } = useTheme(getStyles)

    const handleRemove = useCallback(() => onRemove(owner.address), [onRemove, owner.address])

    return (
      <View style={[styles.ownerRow, withDivider && styles.ownerRowDivider]}>
        <AddressBookContact
          address={owner.address}
          name={owner.name}
          avatarSize={32}
          plainAddressMaxLength={withShortenedAddresses ? SHORTENED_ADDRESS_MAX_LENGTH : undefined}
          style={spacings.ph0}
        />
        <HoverablePressable
          onPress={handleRemove}
          hitSlop={8}
          style={styles.removeOwnerButton}
          accessibilityLabel={t('Remove owner')}
          testID={`safe-create-remove-owner-${owner.address}`}
        >
          <CloseIcon color={theme.iconPrimary} strokeWidth="2" width={12} height={12} />
        </HoverablePressable>
      </View>
    )
  }
)

const SafeCreateForm = ({
  control,
  ownerAddressState,
  ownerAddressValidation,
  validateOwnerAddress,
  owners,
  isAddOwnerButtonDisabled,
  handleAddOwner,
  handleRemoveOwner,
  requiredConfirmations,
  canDecreaseRequiredConfirmations,
  canIncreaseRequiredConfirmations,
  handleDecreaseRequiredConfirmations,
  handleIncreaseRequiredConfirmations,
  withShortenedAddresses
}: Props) => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)

  const confirmationsDescription = useMemo(() => {
    if (!owners.length) return t('Add an owner to set this')
    if (owners.length === 1) return t('The only owner must approve')

    const translationParams = { requiredConfirmations, ownersCount: owners.length }
    if (requiredConfirmations === owners.length)
      return t(
        'All {{requiredConfirmations}} of {{ownersCount}} owners must approve',
        translationParams
      )

    return t(
      'Any {{requiredConfirmations}} of {{ownersCount}} owners must approve',
      translationParams
    )
  }, [owners.length, requiredConfirmations, t])

  return (
    <View>
      <Text fontSize={14} weight="medium" style={spacings.mbTy}>
        {t('Add owner')}
      </Text>
      <Controller
        control={control}
        rules={{ validate: validateOwnerAddress, required: true }}
        name="ownerAddress.fieldValue"
        render={({ field: { onChange, value } }) => (
          <AddressSelect
            address={value}
            setAddress={onChange}
            validation={ownerAddressValidation}
            resolvedAddress={ownerAddressState.resolvedAddress}
            resolvedAddressType={ownerAddressState.resolvedAddressType}
            isRecipientDomainResolving={ownerAddressState.isDomainResolving}
            bottomSheetTitle={t('Add Safe owner')}
            withShortenedAddresses={withShortenedAddresses}
            includeSelectedAccount
            // The parent has the same color as the default input background, so use the focused
            // input color to keep the input visible and the same before and after focus
            inputBackgroundColor={theme.tertiaryBackground}
          />
        )}
      />
      {/* On its own line, so the input is wide enough to show the selected account in full */}
      <Button
        testID="safe-create-add-owner-button"
        size="smaller"
        text={t('Add')}
        hasBottomSpacing={false}
        onPress={handleAddOwner}
        disabled={isAddOwnerButtonDisabled}
      />

      <Text fontSize={18} weight="semiBold" style={[spacings.mtLg, spacings.mbSm]}>
        {t('Owners')}
      </Text>
      {owners.length ? (
        owners.map((owner, index) => (
          <OwnerRow
            key={owner.address}
            owner={owner}
            withShortenedAddresses={withShortenedAddresses}
            withDivider={index < owners.length - 1}
            onRemove={handleRemoveOwner}
          />
        ))
      ) : (
        <Text fontSize={14} appearance="secondaryText">
          {t('No owners added')}
        </Text>
      )}

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
