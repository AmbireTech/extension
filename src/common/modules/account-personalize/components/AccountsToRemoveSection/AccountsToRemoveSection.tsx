import React from 'react'
import { View, ViewStyle } from 'react-native'

import { Account } from '@ambire-common/interfaces/account'
import InfoIcon from '@common/assets/svg/InfoIcon'
import AccountAddress from '@common/components/AccountAddress'
import Avatar from '@common/components/Avatar'
import Badge from '@common/components/Badge'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useReverseLookup from '@common/hooks/useReverseLookup'
import useTheme from '@common/hooks/useTheme'
import getCardStyles from '@common/modules/account-personalize/components/AccountPersonalizeCard/styles'
import AccountsSectionTitle from '@common/modules/account-personalize/components/AccountsSectionTitle'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

const DIMMED_STYLE = { opacity: 0.45 }

/** An account a flow removes - dimmed, as it is about to go */
export const AccountToRemove = React.memo(function AccountToRemove({
  account,
  hasBottomSpacing,
  withBadge,
  style
}: {
  account: Account
  hasBottomSpacing: boolean
  withBadge: boolean
  style?: ViewStyle
}) {
  const { t } = useTranslation()
  const { styles } = useTheme(getCardStyles)
  const reverseLookup = useReverseLookup({ address: account.addr })

  return (
    <View
      testID="account-to-remove"
      style={[
        styles.container,
        flexbox.directionRow,
        flexbox.alignCenter,
        !hasBottomSpacing && spacings.mb0,
        style
      ]}
    >
      <View style={DIMMED_STYLE}>
        <Avatar
          address={account.addr}
          smartAccountType={(account.creation && 'Ambire') || (account.safeCreation && 'Safe')}
          pfp={account.preferences.pfp}
        />
      </View>
      <View style={flexbox.flex1}>
        <Text fontSize={16} weight="medium" appearance="secondaryText" numberOfLines={1}>
          {account.preferences.label}
        </Text>
        <AccountAddress
          {...reverseLookup}
          address={account.addr}
          plainAddressMaxLength={18}
          withCopy={false}
        />
      </View>
      {withBadge && <Badge text={t('Removing')} type="error" />}
    </View>
  )
})

/** Tells the user what removing does, under the accounts being removed */
export const AccountsRemovalNote = React.memo(function AccountsRemovalNote({
  text
}: {
  text: string
}) {
  const { theme } = useTheme()

  return (
    <View style={[flexbox.directionRow, spacings.mtSm, spacings.mhMi]}>
      <InfoIcon width={16} height={16} color={theme.secondaryText} style={spacings.mrTy} />
      <Text fontSize={12} appearance="secondaryText" style={flexbox.flex1}>
        {text}
      </Text>
    </View>
  )
})

type Props = {
  accounts: Account[]
  title: string
  /** Shown under the accounts, e.g. that they can be added back */
  note?: string | null
  /** Marks the accounts as being removed - left out once they are */
  withBadge?: boolean
}

/** The accounts a flow removed, in one block - the web tab lists them once they are removed */
const AccountsToRemoveSection = ({ accounts, title, note, withBadge = true }: Props) => {
  return (
    <View>
      <AccountsSectionTitle title={title} count={accounts.length} type="error" />
      {accounts.map((account, index) => (
        <AccountToRemove
          key={account.addr}
          account={account}
          hasBottomSpacing={index !== accounts.length - 1}
          withBadge={withBadge}
        />
      ))}
      {!!note && <AccountsRemovalNote text={note} />}
    </View>
  )
}

export default React.memo(AccountsToRemoveSection)
