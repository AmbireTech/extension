import React, { useCallback, useMemo } from 'react'
import { View } from 'react-native'

import { Hex } from '@ambire-common/interfaces/hex'
import shortenAddress from '@ambire-common/utils/shortenAddress'
import CloseIcon from '@common/assets/svg/CloseIcon'
import Avatar from '@common/components/Avatar'
import Badge from '@common/components/Badge'
import HoverablePressable from '@common/components/HoverablePressable'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import { SafeOwnerDetails } from '@common/modules/auth/hooks/useSafeOwnerDetails'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  owner: SafeOwnerDetails
  /** Adds a divider under the row, for every row but the last one in its card */
  withDivider?: boolean
  /** Shows whether the user can sign as the owner */
  withSigningBadge?: boolean
  /** Makes the whole row pressable, e.g. to pick it as an owner */
  onPress?: (address: Hex) => void
  /** Shows a button to remove the owner */
  onRemove?: (address: Hex) => void
  testID?: string
}

const SHORTENED_ADDRESS_LENGTH = 13
const REMOVE_BUTTON_SIZE = 32

/**
 * An owner of the Safe about to be created: its avatar, name, where it comes from and
 * address. Shared by the owners card, the add owner sheet and the preview.
 */
const SafeCreateOwnerRow = ({
  owner,
  withDivider,
  withSigningBadge,
  onPress,
  onRemove,
  testID
}: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const shortenedAddress = shortenAddress(owner.address, SHORTENED_ADDRESS_LENGTH)
  // Without a name the address is the title, so it's not repeated under it
  const details = owner.name
    ? [owner.source, shortenedAddress].filter(Boolean).join(' · ')
    : owner.source

  const badge = useMemo(() => {
    if (!withSigningBadge) return null
    if (owner.canSign) return { type: 'success' as const, text: t('Can sign') }
    // An account in the wallet that none of the wallet's keys can sign for
    if (owner.isInWallet) return { type: 'default' as const, text: t('View only') }

    return { type: 'default' as const, text: t('Not in your wallet') }
  }, [withSigningBadge, owner.canSign, owner.isInWallet, t])

  const handlePress = useCallback(() => onPress?.(owner.address), [onPress, owner.address])
  const handleRemove = useCallback(() => onRemove?.(owner.address), [onRemove, owner.address])

  const content = (
    <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.pvSm]}>
      <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.flex1, spacings.mrSm]}>
        <Avatar pfp={owner.address} address={owner.address} size={32} />
        <View style={[flexbox.flex1, spacings.mlSm]}>
          <Text fontSize={14} weight="medium" numberOfLines={1}>
            {owner.name || shortenedAddress}
          </Text>
          {!!details && (
            <Text fontSize={12} appearance="secondaryText" numberOfLines={1}>
              {details}
            </Text>
          )}
        </View>
      </View>
      {!!badge && <Badge type={badge.type} text={badge.text} />}
      {!!onRemove && (
        <HoverablePressable
          onPress={handleRemove}
          accessibilityLabel={t('Remove owner')}
          testID={testID ? `${testID}-remove` : undefined}
          style={[
            flexbox.center,
            {
              width: REMOVE_BUTTON_SIZE,
              height: REMOVE_BUTTON_SIZE,
              borderRadius: REMOVE_BUTTON_SIZE / 2,
              backgroundColor: theme.tertiaryBackground
            }
          ]}
        >
          <CloseIcon width={12} height={12} color={theme.iconPrimary} />
        </HoverablePressable>
      )}
    </View>
  )

  return (
    <>
      {onPress ? (
        <HoverablePressable onPress={handlePress} testID={testID}>
          {content}
        </HoverablePressable>
      ) : (
        <View testID={testID}>{content}</View>
      )}
      {withDivider && <View style={{ height: 1, backgroundColor: theme.secondaryBorder }} />}
    </>
  )
}

export default React.memo(SafeCreateOwnerRow)
