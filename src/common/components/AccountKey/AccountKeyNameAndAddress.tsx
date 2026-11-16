import React, { ReactNode, useMemo } from 'react'
import { View, ViewStyle } from 'react-native'

import { Account } from '@ambire-common/interfaces/account'
import { Key } from '@ambire-common/interfaces/keystore'
import PlainAddressWithCopy from '@common/components/AccountAddress/PlainAddressWithCopy'
import AccountKeysBadge from '@common/components/AccountKeysBadge'
import Avatar from '@common/components/Avatar'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import Text from '@common/components/Text'
import { isMobile } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_MI, SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

const AVATAR_SIZE = 32
/** Short enough to leave room for the Export / Import buttons on the same row */
const ADDRESS_MAX_LENGTH = isMobile ? 13 : 16
/** A key with no account of its own in the wallet is not a Safe */
const NO_OWNER_ACCOUNT = {}

interface Props {
  addr: Key['addr']
  type?: Key['type']
  isImported: boolean
  isDedicatedKey: boolean
  /** The contact, account or key label to show above the address */
  name?: string
  /** The wallet account at the key's address, if there is one */
  ownerAccount?: Account
  fontSize: number
  tooltipContent?: string
  style?: ViewStyle | false
  /** Shown next to the badge, e.g. the networks the key is an owner on */
  children?: ReactNode
}

/**
 * Shows a key like a row of the account list: the name, the address below it, and a badge
 * that tells what the key is (private key, hardware wallet, Safe or view-only account)
 */
const AccountKeyNameAndAddress = ({
  addr,
  type,
  isImported,
  isDedicatedKey,
  name,
  ownerAccount,
  fontSize,
  tooltipContent,
  style,
  children
}: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const nameText = isDedicatedKey ? t('(dedicated key)') : name
  const badgeKeys = useMemo(() => (isImported && type ? [{ type }] : []), [isImported, type])
  // A key that is not imported and is not an account of the wallet has nothing to tell in the badge
  const hasBadge = !!badgeKeys.length || !!ownerAccount
  const hasBadgeRow = hasBadge || !!children

  return (
    <View
      style={[flexbox.directionRow, flexbox.alignCenter, flexbox.flex1, { minWidth: 0 }, style]}
    >
      <Avatar
        address={addr}
        pfp={ownerAccount?.preferences.pfp ?? addr}
        size={AVATAR_SIZE}
        displayTypeBadge={false}
      />
      <View style={[flexbox.flex1, { minWidth: 0 }]}>
        {!!nameText && (
          <Text
            fontSize={fontSize - 1}
            weight={isDedicatedKey ? 'semiBold' : 'medium'}
            color={isDedicatedKey ? theme.infoDecorative : theme.primaryText}
            numberOfLines={1}
            dataSet={createGlobalTooltipDataSet({
              id: `key-name-${addr}-${type}-tooltip`,
              content: tooltipContent ?? addr
            })}
          >
            {nameText}
          </Text>
        )}
        <PlainAddressWithCopy address={addr} maxLength={ADDRESS_MAX_LENGTH} hideParentheses />
        {hasBadgeRow && (
          <View
            style={[
              flexbox.directionRow,
              flexbox.alignCenter,
              flexbox.wrap,
              spacings.mtMi,
              { columnGap: SPACING_TY, rowGap: SPACING_MI }
            ]}
          >
            {hasBadge && (
              <AccountKeysBadge
                account={ownerAccount ?? NO_OWNER_ACCOUNT}
                accountKeys={badgeKeys}
              />
            )}
            {children}
          </View>
        )}
      </View>
    </View>
  )
}

export default React.memo(AccountKeyNameAndAddress)
