import React, { useCallback, useMemo } from 'react'

import { Account as AccountInterface } from '@ambire-common/interfaces/account'
import { SafeAccountByOwner } from '@ambire-common/interfaces/safe'
import ScrollableWrapper, { WRAPPER_TYPES } from '@common/components/ScrollableWrapper'
import flexbox from '@common/styles/utils/flexbox'

import SafeAccountRow from './SafeAccountRow'

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

      return (
        <SafeAccountRow
          account={item}
          importedAccount={importedAccount}
          withBottomSpacing={index < accounts.length - 1}
          isSelected={selectedAddressSet.has(normalizedAddress)}
          onSelect={handleSelectAccount}
          onDeselect={handleDeselectAccount}
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

  const keyExtractor = useCallback((account: SafeAccountByOwner) => account.addr.toLowerCase(), [])

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
