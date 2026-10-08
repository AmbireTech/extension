import { useCallback, useMemo, useRef, useState } from 'react'

import type { Account } from '@ambire-common/interfaces/account'
import type { AccountsSyncExportOptions } from '@ambire-common/libs/accountsSync/accountsSync'
import useController from '@common/hooks/useController'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectAccounts = (state: AllControllersMappingType['AccountsController']) => state.accounts
const selectKeys = (state: AllControllersMappingType['KeystoreController']) => state.keys
const selectThemeType = (state: AllControllersMappingType['WalletStateController']) =>
  state.themeType
const selectAvatarType = (state: AllControllersMappingType['WalletStateController']) =>
  state.avatarType
const selectCrashAnalyticsEnabled = (state: AllControllersMappingType['WalletStateController']) =>
  state.crashAnalyticsEnabled

/** What the user can sync besides the accounts */
export type SyncOption = 'settings' | 'networks' | 'addressBook'

const NO_SYNC_OPTIONS: Record<SyncOption, boolean> = {
  settings: false,
  networks: false,
  addressBook: false
}

const ALL_SYNC_OPTIONS: Record<SyncOption, boolean> = {
  settings: true,
  networks: true,
  addressBook: true
}

/**
 * Owns the export side of the accounts sync: which accounts (and whether the settings,
 * networks and Address Book) the user picked and the payload the other device has to
 * scan. The payload is requested from the background only once the selection is
 * confirmed, so it is never prepared needlessly.
 */
const useAccountsSyncExport = () => {
  const { state: accounts } = useController('AccountsController', selectAccounts)
  const { state: keys } = useController('KeystoreController', selectKeys)
  const { state: themeType } = useController('WalletStateController', selectThemeType)
  const { state: avatarType } = useController('WalletStateController', selectAvatarType)
  const { state: crashAnalyticsEnabled } = useController(
    'WalletStateController',
    selectCrashAnalyticsEnabled
  )
  const { dispatchAndWait } = useController('MainController')

  const [selectedAddrs, setSelectedAddrs] = useState<Account['addr'][]>([])
  const [includeSeeds, setIncludeSeeds] = useState(true)
  const [syncOptions, setSyncOptions] = useState(NO_SYNC_OPTIONS)
  const [payload, setPayload] = useState<string | null>(null)
  const [isPreparing, setIsPreparing] = useState(false)

  /** Every account and every one of the settings, networks and Address Book */
  const areAllSelected = useMemo(
    () =>
      !!accounts.length &&
      selectedAddrs.length === accounts.length &&
      Object.values(syncOptions).every(Boolean),
    [accounts.length, selectedAddrs.length, syncOptions]
  )

  /** Whether there is anything at all to export: an account or one of the options */
  const hasSelection = useMemo(
    () => !!selectedAddrs.length || Object.values(syncOptions).some(Boolean),
    [selectedAddrs.length, syncOptions]
  )

  const seedIdByKeyAddr = useMemo(
    () =>
      new Map(
        keys
          .filter(({ meta }) => !!meta.fromSeedId)
          .map(({ addr, meta }) => [addr, meta.fromSeedId])
      ),
    [keys]
  )

  /**
   * How many of the recovery phrases this device stores the picked accounts were derived
   * from. Zero means there is no phrase that could travel along with the export.
   */
  const selectedSeedsCount = useMemo(() => {
    const seedIds = new Set(
      accounts
        .filter((account) => selectedAddrs.includes(account.addr))
        .flatMap((account) => account.associatedKeys.map((keyAddr) => seedIdByKeyAddr.get(keyAddr)))
        .filter(Boolean)
    )

    return seedIds.size
  }, [accounts, seedIdByKeyAddr, selectedAddrs])

  const discardPayload = useCallback(() => setPayload(null), [])

  const resetCount = useRef(0)

  /** Forgets the selection and the prepared payload, so the export starts from scratch. */
  const reset = useCallback(() => {
    resetCount.current += 1
    setSelectedAddrs([])
    setIncludeSeeds(true)
    setSyncOptions(NO_SYNC_OPTIONS)
    setPayload(null)
  }, [])

  const toggleIncludeSeeds = useCallback(() => {
    discardPayload()
    setIncludeSeeds((prev) => !prev)
  }, [discardPayload])

  const toggleSyncOption = useCallback(
    (option: SyncOption) => {
      discardPayload()
      setSyncOptions((prev) => ({ ...prev, [option]: !prev[option] }))
    },
    [discardPayload]
  )

  const toggleAccount = useCallback(
    (addr: Account['addr']) => {
      discardPayload()
      setSelectedAddrs((prevAddrs) =>
        prevAddrs.includes(addr) ? prevAddrs.filter((a) => a !== addr) : [...prevAddrs, addr]
      )
    },
    [discardPayload]
  )

  const toggleAll = useCallback(() => {
    discardPayload()
    setSelectedAddrs(areAllSelected ? [] : accounts.map((account) => account.addr))
    setSyncOptions(areAllSelected ? NO_SYNC_OPTIONS : ALL_SYNC_OPTIONS)
  }, [accounts, areAllSelected, discardPayload])

  const prepareExport = useCallback(async () => {
    if (!hasSelection || isPreparing) return

    const resetCountAtStart = resetCount.current
    setIsPreparing(true)
    try {
      const options: AccountsSyncExportOptions = {
        includeSeeds,
        // The app keeps these settings itself, so they are handed over to the background
        appSettings: syncOptions.settings
          ? { themeType, avatarType, crashAnalyticsEnabled }
          : undefined,
        includeNetworks: syncOptions.networks,
        includeContacts: syncOptions.addressBook
      }
      const nextPayload = await dispatchAndWait<'exportAccountsForSync', string>({
        type: 'method',
        params: { method: 'exportAccountsForSync', args: [selectedAddrs, options] }
      })

      if (resetCount.current !== resetCountAtStart) return

      setPayload(nextPayload)
    } catch {
      // The controller emits the error itself (which the UI shows as a toast), so here
      // we only make sure no QR codes are displayed
      setPayload(null)
    } finally {
      setIsPreparing(false)
    }
  }, [
    avatarType,
    crashAnalyticsEnabled,
    dispatchAndWait,
    hasSelection,
    includeSeeds,
    isPreparing,
    selectedAddrs,
    syncOptions,
    themeType
  ])

  return {
    accounts,
    selectedAddrs,
    areAllSelected,
    hasSelection,
    selectedSeedsCount,
    includeSeeds,
    toggleIncludeSeeds,
    syncOptions,
    toggleSyncOption,
    toggleAccount,
    toggleAll,
    prepareExport,
    isPreparing,
    discardPayload,
    reset,
    // The animated QR component expects the payload without the hex prefix
    qrCbor: payload ? payload.slice(2) : null
  }
}

export default useAccountsSyncExport
