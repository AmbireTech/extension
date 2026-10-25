import { useCallback, useMemo, useState } from 'react'

import { Account } from '@ambire-common/interfaces/account'
import { Dapp, DappAccountPreferences } from '@ambire-common/interfaces/dapp'
import { getAccountsForDapp } from '@ambire-common/libs/dapps/helpers'

type Params = {
  accounts: Account[]
  /** The account selected in the wallet */
  walletAccountAddr: string | undefined
  accountPreferences: Dapp['accountPreferences']
  /** Makes a picked account the app's alone, instead of switching the wallet's to it */
  pinsPickedAccount?: boolean
}

/**
 * Keeps the account the user picks and the accounts an app may see as unsaved edits,
 * so they can be applied together on Save (Done when connecting) or thrown away on Cancel.
 * The picked account is always visible to the app.
 */
const useAccountSelectAccess = ({
  accounts,
  walletAccountAddr,
  accountPreferences,
  pinsPickedAccount
}: Params) => {
  const [pendingAccountAddr, setPendingAccountAddr] = useState<string | null>(null)
  // `null` means untouched, so the saved preferences keep showing through
  const [pendingPreferences, setPendingPreferences] = useState<DappAccountPreferences | null>(null)

  const preferences = pendingPreferences ?? accountPreferences
  // The account the app ends up with without switching the wallet's - the one picked for it,
  // otherwise the wallet's own when the app may see it, otherwise the one it last used
  const getAppAccountAddr = (appPreferences: Dapp['accountPreferences']) => {
    const [preferredAddr] = getAccountsForDapp(appPreferences, walletAccountAddr)
    // A removed account can still be in the saved preferences
    return accounts.some((acc) => acc.addr === preferredAddr) ? preferredAddr : walletAccountAddr
  }
  const appAccountAddr = getAppAccountAddr(preferences)
  // The account the app has before the unsaved edits
  const savedAppAccountAddr = getAppAccountAddr(accountPreferences)
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

  // An app that can see every account follows the wallet's, which is what the preferences being
  // off means - unless an account is pinned for it, until the wallet switches to another one
  const setVisibleAccounts = useCallback(
    (
      nextAddrs: string[],
      nextAccountAddr: string,
      isPinned = !!preferences?.isSelectedAccountPinned
    ) => {
      const isEveryAccountVisible = accounts.every((acc) => nextAddrs.includes(acc.addr))

      setPendingPreferences({
        enabled: !isEveryAccountVisible,
        accounts: nextAddrs,
        selectedAccount: nextAccountAddr,
        ...(isPinned && { isSelectedAccountPinned: true })
      })
    },
    [accounts, preferences?.isSelectedAccountPinned]
  )

  const visibleAddrs = useMemo(() => visibleAccounts.map((acc) => acc.addr), [visibleAccounts])

  const pickAccount = useCallback(
    (addr: string) => {
      // Picking the account that's already picked changes nothing, so there's nothing to save
      if (addr === accountAddr) return

      setPendingAccountAddr(addr)
      if (!isLimited && !pinsPickedAccount) return

      // The previously picked account stays visible, as it was shown to the user that way
      const nextAddrs = [...new Set([...visibleAddrs, addr])]
      if (pinsPickedAccount) {
        setVisibleAccounts(nextAddrs, addr, true)
        return
      }
      setVisibleAccounts(nextAddrs, addr)
    },
    [accountAddr, isLimited, pinsPickedAccount, visibleAddrs, setVisibleAccounts]
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

  // Then the wallet switches to the picked account too, or the app wouldn't end up with it.
  // Never when the pick is pinned for the app, as the app ends up with it anyway
  const hasAccountChanged = !!pendingAccountAddr && pendingAccountAddr !== appAccountAddr
  const hasPreferencesChanged = !!pendingPreferences

  return {
    accountAddr,
    isLimited,
    visibleAccounts,
    hiddenAccounts,
    pendingPreferences,
    hasAccountChanged,
    // Unlike `hasAccountChanged`, also false for an unsaved account picked for the app alone
    isSavedAccountPicked: accountAddr === savedAppAccountAddr,
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
