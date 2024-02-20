import React, { useCallback, useContext, useEffect, useRef } from 'react'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import Search from '@common/components/Search'
import useAccounts from '@common/hooks/useAccounts/useAccounts'
import useElementSize from '@common/hooks/useElementSize'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import useSettingsControllerState from '@web/hooks/useSettingsControllerState'
import Account from '@web/modules/account-select/components/Account'
import AddAccount from '@web/modules/account-select/components/AddAccount'
import SettingsPageHeader from '@web/modules/settings/components/SettingsPageHeader'

import { SettingsRoutesContext } from '../../contexts/SettingsRoutesContext'

const AccountsSettingsScreen = () => {
  const { addToast } = useToast()
  const { accountPreferences } = useSettingsControllerState()
  const { accounts, control } = useAccounts()
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()
  const accountsContainerRef = useRef(null)
  const { minElementWidthSize, maxElementWidthSize } = useElementSize(accountsContainerRef)
  const { setCurrentSettingsPage } = useContext(SettingsRoutesContext)

  useEffect(() => {
    setCurrentSettingsPage('accounts')
  }, [setCurrentSettingsPage])

  const shortenAccountAddr = () => {
    if (maxElementWidthSize(800)) return undefined
    if (maxElementWidthSize(700) && minElementWidthSize(800)) return 32
    if (maxElementWidthSize(600) && minElementWidthSize(700)) return 24
    if (maxElementWidthSize(500) && minElementWidthSize(600)) return 16

    return 10
  }

  const onSelectAccount = useCallback(
    (addr: string) => {
      addToast(`Selected account ${accountPreferences[addr]?.label || addr}`)
    },
    [accountPreferences, addToast]
  )

  return (
    <>
      <SettingsPageHeader title="Accounts">
        <Search placeholder="Search for account" control={control} />
      </SettingsPageHeader>
      <View style={spacings.mb} ref={accountsContainerRef}>
        {accounts.map((account) => (
          <Account
            onSelect={onSelectAccount}
            isCopyVisible={false}
            key={account.addr}
            account={account}
            maxAccountAddrLength={shortenAccountAddr()}
          />
        ))}
      </View>
      <Button
        type="secondary"
        onPress={openBottomSheet as any}
        text="Add account"
        hasBottomSpacing={false}
      />
      <BottomSheet sheetRef={sheetRef} closeBottomSheet={closeBottomSheet}>
        <AddAccount />
      </BottomSheet>
    </>
  )
}

export default React.memo(AccountsSettingsScreen)
