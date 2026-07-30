import React, { useCallback, useMemo } from 'react'

import { Account as AccountInterface, ImportStatus } from '@ambire-common/interfaces/account'
import { SafeAccountByOwner } from '@ambire-common/interfaces/safe'
import ScrollableWrapper, { WRAPPER_TYPES } from '@common/components/ScrollableWrapper'
import Account from '@common/modules/account-picker/components/Account'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  accounts: SafeAccountByOwner[]
  importedAccounts: AccountInterface[]
  selectedAddresses: string[]
  onChangeAccountSelection: (address: string, shouldSelect: boolean) => void
}

const SafeAccountList = ({
  accounts,
  importedAccounts,
  selectedAddresses,
  onChangeAccountSelection
}: Props) => {
  const importedAccountByAddress = useMemo(
    () => new Map(importedAccounts.map((account) => [account.addr.toLowerCase(), account])),
    [importedAccounts]
  )
  const selectedAddressSet = useMemo(
    () => new Set(selectedAddresses.map((address) => address.toLowerCase())),
    [selectedAddresses]
  )

  const handleSelectAccount = useCallback(
    (account: AccountInterface) => onChangeAccountSelection(account.addr, true),
    [onChangeAccountSelection]
  )
  const handleDeselectAccount = useCallback(
    (account: AccountInterface) => onChangeAccountSelection(account.addr, false),
    [onChangeAccountSelection]
  )

  const renderItem = useCallback(
    ({ item, index }: { item: SafeAccountByOwner; index: number }) => {
      const normalizedAddress = item.addr.toLowerCase()
      const importedAccount = importedAccountByAddress.get(normalizedAddress)
      const account = importedAccount
        ? {
            ...item,
            preferences: {
              ...item.preferences,
              label: importedAccount.preferences.label
            }
          }
        : item

      return (
        <Account
          account={account}
          type="smart"
          unused={false}
          withBottomSpacing={index < accounts.length - 1}
          isSelected={selectedAddressSet.has(normalizedAddress)}
          onSelect={handleSelectAccount}
          onDeselect={handleDeselectAccount}
          importStatus={
            importedAccount ? ImportStatus.ImportedWithTheSameKeys : ImportStatus.NotImported
          }
          displayTypeBadge={false}
          displayTypePill={false}
          deployedOnNetworks={item.deployedOn}
          hideAddressWhenAccountHasLabel
          shouldAlwaysShortenAddress
        />
      )
    },
    [
      accounts.length,
      handleDeselectAccount,
      handleSelectAccount,
      importedAccountByAddress,
      selectedAddressSet
    ]
  )

  const keyExtractor = useCallback((account: SafeAccountByOwner) => account.addr, [])

  return (
    <ScrollableWrapper
      type={WRAPPER_TYPES.FLAT_LIST}
      data={accounts}
      style={flexbox.flex1}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
    />
  )
}

export default React.memo(SafeAccountList)
