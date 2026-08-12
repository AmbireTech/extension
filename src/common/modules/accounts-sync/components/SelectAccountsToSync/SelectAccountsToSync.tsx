import React from 'react'
import { View, ViewStyle } from 'react-native'

import { Account } from '@ambire-common/interfaces/account'
import Checkbox from '@common/components/Checkbox'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import AccountRow from '@common/modules/account-select/components/Account'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Props {
  accounts: Account[]
  selectedAddrs: Account['addr'][]
  areAllSelected: boolean
  onToggleAccount: (addr: Account['addr']) => void
  onToggleAllAccounts: () => void
  style?: ViewStyle
}

/**
 * The list the user picks the accounts to send to the other Ambire product from. Rows
 * are the same account rows as everywhere else, only pressing one ticks it instead of
 * switching to it.
 */
const SelectAccountsToSync = ({
  accounts,
  selectedAddrs,
  areAllSelected,
  onToggleAccount,
  onToggleAllAccounts,
  style
}: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()

  return (
    <View style={style}>
      <Checkbox
        value={areAllSelected}
        onValueChange={onToggleAllAccounts}
        label={t('Select all')}
        labelProps={{ fontSize: 14, appearance: 'primaryText' }}
        style={spacings.mbSm}
      />
      {accounts.map((account) => (
        <View key={account.addr} style={[flexbox.directionRow, flexbox.alignCenter, spacings.mbTy]}>
          <Checkbox
            value={selectedAddrs.includes(account.addr)}
            onValueChange={() => onToggleAccount(account.addr)}
            style={spacings.mb0}
            uncheckedBorderColor={theme.secondaryBorder}
          />
          <AccountRow
            account={account}
            onSelect={onToggleAccount}
            switchAccountOnPress={false}
            withSettings={false}
            containerStyle={flexbox.flex1}
          />
        </View>
      ))}
    </View>
  )
}

export default React.memo(SelectAccountsToSync)
