import { useCallback, useMemo, useState } from 'react'

import { Account } from '@ambire-common/interfaces/account'
import { Dapp, DappAccountPreferences } from '@ambire-common/interfaces/dapp'
import { getAccountsForDapp } from '@ambire-common/libs/dapps/helpers'

type Params = {
  accounts: Account[]
  /** The account selected in the wallet */
  walletAccountAddr: string | undefined
  accountPreferences: Dapp['accountPreferences']
}

/**
 * Keeps the account the user picks and the accounts an app may see as unsaved edits,
 * so they can be applied together on Save (Done when connecting) or thrown away on Cancel.
 * The picked account is always visible to the app.
 */
const useAccountSelectAccess = ({ accounts, walletAccountAddr, accountPreferences }: Params) => {
  const [pendingAccountAddr, setPendingAccountAddr] = useState<string | null>(null)
  // `null` means untouched, so the saved preferences keep showing through
  const [pendingPreferences, setPendingPreferences] = useState<DappAccountPreferences | null>(null)

  const preferences = pendingPreferences ?? accountPreferences
  // The account the app ends up with without switching the wallet's - the wallet's own when the
  // app may see it, otherwise the one it last used
  const [preferredAddr] = getAccountsForDapp(preferences, walletAccountAddr)
  // A removed account can still be in the saved preferences
  const appAccountAddr = accounts.some((acc) => acc.addr === preferredAddr)
    ? preferredAddr
    : walletAccountAddr
  const accountAddr = pendingAccountAddr ?? appAccountAddr ?? ''
  const isLimited = !!preferences?.enabled

  const isVisible = useCallback(
    (addr: string) => !isLimited || addr === accountAddr || !!preferences?.accounts.includes(addr),
    [isLimited, accountAddr, preferences?.accounts]
  )

  const visibleAccounts = useMemo(
    () => accounts.filter((acc) => isVisible(acc.addr)),
    [accounts, isVisible]
  )

  const hiddenAccounts = useMemo(
    () => accounts.filter((acc) => !isVisible(acc.addr)),
    [accounts, isVisible]
  )

  // An app that can see every account follows whatever the user selects, which is
  // what the preferences being off means
  const setVisibleAccounts = useCallback(
    (nextAddrs: string[], nextAccountAddr: string) => {
      const isEveryAccountVisible = accounts.every((acc) => nextAddrs.includes(acc.addr))

      setPendingPreferences({
        enabled: !isEveryAccountVisible,
        accounts: nextAddrs,
        selectedAccount: nextAccountAddr
      })
    },
    [accounts]
  )

  const visibleAddrs = useMemo(() => visibleAccounts.map((acc) => acc.addr), [visibleAccounts])

  const pickAccount = useCallback(
    (addr: string) => {
      setPendingAccountAddr(addr)
      if (!isLimited) return

      // The previously picked account stays visible, as it was shown to the user that way
      setVisibleAccounts([...new Set([...visibleAddrs, addr])], addr)
    },
    [isLimited, visibleAddrs, setVisibleAccounts]
  )

  const hideAccount = useCallback(
    (addr: string) => {
      setVisibleAccounts(
        visibleAddrs.filter((visibleAddr) => visibleAddr !== addr),
        accountAddr
      )
    },
    [visibleAddrs, accountAddr, setVisibleAccounts]
  )

  const showAccount = useCallback(
    (addr: string) => setVisibleAccounts([...visibleAddrs, addr], accountAddr),
    [visibleAddrs, accountAddr, setVisibleAccounts]
  )

  const showAllAccounts = useCallback(
    () =>
      setVisibleAccounts(
        accounts.map((acc) => acc.addr),
        accountAddr
      ),
    [accounts, accountAddr, setVisibleAccounts]
  )

  const limitToPickedAccount = useCallback(
    () => setVisibleAccounts([accountAddr], accountAddr),
    [accountAddr, setVisibleAccounts]
  )

  const reset = useCallback(() => {
    setPendingAccountAddr(null)
    setPendingPreferences(null)
  }, [])

  // Then the wallet switches to the picked account too, or the app wouldn't end up with it
  const hasAccountChanged = !!pendingAccountAddr && pendingAccountAddr !== appAccountAddr
  const hasPreferencesChanged = !!pendingPreferences

  return {
    accountAddr,
    isLimited,
    visibleAccounts,
    hiddenAccounts,
    pendingPreferences,
    hasAccountChanged,
    isDirty: hasAccountChanged || hasPreferencesChanged,
    pickAccount,
    hideAccount,
    showAccount,
    showAllAccounts,
    limitToPickedAccount,
    reset
  }
}

export default useAccountSelectAccess
