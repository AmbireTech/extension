import React, { useMemo } from 'react'
import { View } from 'react-native'

import shortenAddress from '@ambire-common/utils/shortenAddress'
import Avatar from '@common/components/Avatar'
import Badge from '@common/components/Badge'
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
  testID?: string
}

const SHORTENED_ADDRESS_LENGTH = 13

/**
 * An owner of the Safe from Safe create, as the personalize step shows it: its avatar, name,
 * where it comes from, address and whether the user can sign as it.
 */
const SafeCreateOwnerRow = ({ owner, withDivider, testID }: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const shortenedAddress = shortenAddress(owner.address, SHORTENED_ADDRESS_LENGTH)
  // Without a name the address is the title, so it's not repeated under it
  const details = owner.name
    ? [owner.source, shortenedAddress].filter(Boolean).join(' · ')
    : owner.source

  const badge = useMemo(() => {
    if (owner.canSign) return { type: 'success' as const, text: t('Can sign') }
    // An account in the wallet that none of the wallet's keys can sign for
    if (owner.isInWallet) return { type: 'default' as const, text: t('View only') }

    return { type: 'default' as const, text: t('Not in your wallet') }
  }, [owner.canSign, owner.isInWallet, t])

  return (
    <>
      <View testID={testID} style={[flexbox.directionRow, flexbox.alignCenter, spacings.pvSm]}>
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
        <Badge type={badge.type} text={badge.text} />
      </View>
      {withDivider && <View style={{ height: 1, backgroundColor: theme.secondaryBorder }} />}
    </>
  )
}

export default React.memo(SafeCreateOwnerRow)
