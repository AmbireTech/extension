import { useCallback, useMemo, useRef, useState } from 'react'

import type { Account } from '@ambire-common/interfaces/account'
import useController from '@common/hooks/useController'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectAccounts = (state: AllControllersMappingType['AccountsController']) => state.accounts
const selectKeys = (state: AllControllersMappingType['KeystoreController']) => state.keys

/**
 * Owns the export side of the accounts sync: which accounts the user picked and the
 * payload the other device has to scan. The payload is requested from the background
 * only once the selection is confirmed, so it is never prepared needlessly.
 */
const useAccountsSyncExport = () => {
  const { state: accounts } = useController('AccountsController', selectAccounts)
  const { state: keys } = useController('KeystoreController', selectKeys)
  const { dispatchAndWait } = useController('MainController')

  const [selectedAddrs, setSelectedAddrs] = useState<Account['addr'][]>([])
  const [includeSeeds, setIncludeSeeds] = useState(true)
  const [payload, setPayload] = useState<string | null>(null)
  const [isPreparing, setIsPreparing] = useState(false)

  const areAllSelected = useMemo(
    () => !!accounts.length && selectedAddrs.length === accounts.length,
    [accounts.length, selectedAddrs.length]
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
    setPayload(null)
  }, [])

  const toggleIncludeSeeds = useCallback(() => {
    discardPayload()
    setIncludeSeeds((prev) => !prev)
  }, [discardPayload])

  const toggleAccount = useCallback(
    (addr: Account['addr']) => {
      discardPayload()
      setSelectedAddrs((prevAddrs) =>
        prevAddrs.includes(addr) ? prevAddrs.filter((a) => a !== addr) : [...prevAddrs, addr]
      )
    },
    [discardPayload]
  )

  const toggleAllAccounts = useCallback(() => {
    discardPayload()
    setSelectedAddrs((prevAddrs) =>
      prevAddrs.length === accounts.length ? [] : accounts.map((account) => account.addr)
    )
  }, [accounts, discardPayload])

  const prepareExport = useCallback(async () => {
    if (!selectedAddrs.length || isPreparing) return

    const resetCountAtStart = resetCount.current
    setIsPreparing(true)
    try {
      const nextPayload = await dispatchAndWait<'exportAccountsForSync', string>({
        type: 'method',
        params: { method: 'exportAccountsForSync', args: [selectedAddrs, includeSeeds] }
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
  }, [dispatchAndWait, includeSeeds, isPreparing, selectedAddrs])

  return {
    accounts,
    selectedAddrs,
    areAllSelected,
    selectedSeedsCount,
    includeSeeds,
    toggleIncludeSeeds,
    toggleAccount,
    toggleAllAccounts,
    prepareExport,
    isPreparing,
    discardPayload,
    reset,
    // The animated QR component expects the payload without the hex prefix
    qrCbor: payload ? payload.slice(2) : null
  }
}

export default useAccountsSyncExport
