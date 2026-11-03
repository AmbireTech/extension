import React, { useMemo } from 'react'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import AddIcon from '@common/assets/svg/AddIcon'
import InfoIcon from '@common/assets/svg/InfoIcon'
import HoverablePressable from '@common/components/HoverablePressable'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import SafeCreateAddOwnerBottomSheet from '@common/modules/auth/components/SafeCreateAddOwnerBottomSheet'
import SafeCreateOwnerRow from '@common/modules/auth/components/SafeCreateOwnerRow'
import SafeCreateSectionLabel from '@common/modules/auth/components/SafeCreateSectionLabel'
import useSafeCreate from '@common/modules/auth/hooks/useSafeCreate'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'

type Props = Pick<
  ReturnType<typeof useSafeCreate>,
  | 'owners'
  | 'addOwner'
  | 'removeOwner'
  | 'requiredConfirmations'
  | 'canDecreaseRequiredConfirmations'
  | 'canIncreaseRequiredConfirmations'
  | 'handleDecreaseRequiredConfirmations'
  | 'handleIncreaseRequiredConfirmations'
>

const SafeCreateForm = ({
  owners,
  addOwner,
  removeOwner,
  requiredConfirmations,
  canDecreaseRequiredConfirmations,
  canIncreaseRequiredConfirmations,
  handleDecreaseRequiredConfirmations,
  handleIncreaseRequiredConfirmations
}: Props) => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)
  const {
    ref: addOwnerSheetRef,
    open: openAddOwnerSheet,
    close: closeAddOwnerSheet
  } = useModalize()
  const ownersCount = owners.length
  const ownerAddresses = useMemo(() => owners.map(({ address }) => address), [owners])

  const confirmationsDescription = useMemo(() => {
    if (!ownersCount) return t('Add at least one owner first.')
    if (ownersCount === 1) return t('The only owner must approve each transaction.')

    const translationParams = { requiredConfirmations, ownersCount }
    if (requiredConfirmations === ownersCount)
      return t('All {{ownersCount}} owners must approve each transaction.', translationParams)

    return t(
      'Any {{requiredConfirmations}} of the {{ownersCount}} owners must approve each transaction.',
      translationParams
    )
  }, [ownersCount, requiredConfirmations, t])

  return (
    <View>
      <SafeCreateSectionLabel>
        {ownersCount ? t('Owners · {{ownersCount}}', { ownersCount }) : t('Owners')}
      </SafeCreateSectionLabel>
      <View style={styles.card}>
        {owners.map((owner) => (
          <SafeCreateOwnerRow
            key={owner.address}
            owner={owner}
            onRemove={removeOwner}
            withDivider
            testID={`safe-create-owner-${owner.address}`}
          />
        ))}
        <HoverablePressable
          testID="safe-create-add-owner"
          onPress={openAddOwnerSheet as () => void}
          style={[flexbox.directionRow, flexbox.alignCenter, spacings.pvSm]}
        >
          <View style={styles.addOwnerIcon}>
            <AddIcon width={18} height={18} color={theme.primary} />
          </View>
          <Text fontSize={14} weight="semiBold" appearance="primary" style={spacings.mlSm}>
            {t('Add owner')}
          </Text>
        </HoverablePressable>
      </View>
      <Text fontSize={14} appearance="secondaryText" style={spacings.mtTy}>
        {t('Owners can be your own accounts, a hardware wallet, or someone you trust.')}
      </Text>

      <SafeCreateSectionLabel>{t('Approvals needed')}</SafeCreateSectionLabel>
      <View style={styles.card}>
        <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.pvSm]}>
          <Text
            fontSize={14}
            weight="semiBold"
            appearance={ownersCount ? 'primaryText' : 'tertiaryText'}
            style={[flexbox.flex1, spacings.mrSm]}
            testID="safe-create-required-confirmations"
          >
            {ownersCount
              ? t('{{requiredConfirmations}} of {{ownersCount}} owners', {
                  requiredConfirmations,
                  ownersCount
                })
              : t('No owners yet')}
          </Text>
          <View style={styles.stepper}>
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
              <Text style={styles.minusSign}>−</Text>
            </HoverablePressable>
            <View style={styles.stepperDivider} />
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
              <AddIcon width={18} height={18} color={theme.primaryText} />
            </HoverablePressable>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.pvSm]}>
          <InfoIcon width={18} height={18} color={theme.iconPrimary} />
          <Text fontSize={14} appearance="secondaryText" style={[flexbox.flex1, spacings.mlTy]}>
            {confirmationsDescription}
          </Text>
        </View>
      </View>

      <SafeCreateAddOwnerBottomSheet
        sheetRef={addOwnerSheetRef}
        closeBottomSheet={closeAddOwnerSheet}
        ownerAddresses={ownerAddresses}
        onAdd={addOwner}
      />
    </View>
  )
}

export default React.memo(SafeCreateForm)
