import { useCallback, useEffect, useRef, useState } from 'react'

import { captureException } from '@common/config/analytics/CrashAnalytics'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useToast from '@common/hooks/useToast'

import type { WalletStakingMode } from '@common/modules/wallet-staking/constants/staking'

/**
 * Loads how much $WALLET one xWALLET share is worth - needed to turn the entered stkWALLET amount
 * into the shares the unstake call commits. Only fetched while the unstake tab is open.
 */
const useXWalletShareValue = (mode: WalletStakingMode) => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { dispatchAndWait: providersDispatchAndWait } = useController('ProvidersController')
  const [shareValue, setShareValue] = useState<bigint | null>(null)
  const [isLoadingShareValue, setIsLoadingShareValue] = useState(false)
  const requestIdRef = useRef(0)
  const shareValueRef = useRef<bigint | null>(null)
  const isLoadingRef = useRef(false)

  const loadShareValue = useCallback(async () => {
    if (shareValueRef.current !== null || isLoadingRef.current) return

    const requestId = ++requestIdRef.current
    isLoadingRef.current = true
    setIsLoadingShareValue(true)
    try {
      const nextShareValue = await providersDispatchAndWait<
        'getXWalletShareValueAndSendResToUi',
        bigint
      >({
        type: 'method',
        params: {
          method: 'getXWalletShareValueAndSendResToUi',
          args: []
        }
      })
      const normalizedShareValue = BigInt(nextShareValue)
      if (normalizedShareValue <= 0n) {
        throw new Error('The WALLET staking conversion rate is unavailable.')
      }

      if (requestId === requestIdRef.current) {
        shareValueRef.current = normalizedShareValue
        setShareValue(normalizedShareValue)
      }
    } catch (error) {
      if (requestId !== requestIdRef.current) return

      console.error('Failed to load WALLET staking share value', error)
      captureException(error)
      addToast(t("We couldn't load the unstaking details. Please try again."), { type: 'error' })
    } finally {
      isLoadingRef.current = false
      if (requestId === requestIdRef.current) setIsLoadingShareValue(false)
    }
  }, [addToast, providersDispatchAndWait, t])

  useEffect(() => {
    if (mode !== 'unstake') return undefined

    const loadTimeout = setTimeout(() => void loadShareValue(), 0)
    return () => clearTimeout(loadTimeout)
  }, [loadShareValue, mode])

  useEffect(
    () => () => {
      requestIdRef.current += 1
    },
    []
  )

  return { shareValue, isLoadingShareValue, loadShareValue }
}

export default useXWalletShareValue
