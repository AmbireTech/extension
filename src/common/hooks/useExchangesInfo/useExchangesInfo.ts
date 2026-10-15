import { useEffect, useRef, useState } from 'react'

import { ExchangeInfoMap } from '@ambire-common/libs/portfolio/interfaces'
import { captureException } from '@common/config/analytics/CrashAnalytics'
import useController from '@common/hooks/useController'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectExchangeListUpdatedAt = (state: AllControllersMappingType['PortfolioController']) =>
  state.exchangeListUpdatedAt

/**
 * Looks up the name, logo and url of the given exchanges in the background, with one
 * request for all ids that haven't been looked up yet. Pass the ids of everything on
 * screen at once rather than calling it per token. Ids the background doesn't know are
 * left out and not asked for again.
 */
const useExchangesInfo = (exchangeIds: string[]): ExchangeInfoMap => {
  const { dispatchAndWait } = useController('PortfolioController')
  const { state: exchangeListUpdatedAt } = useController(
    'PortfolioController',
    selectExchangeListUpdatedAt
  )
  const [exchangesInfo, setExchangesInfo] = useState<ExchangeInfoMap>({})
  // Includes the ids that are still being looked up, so a change of ids in the meantime
  // doesn't ask for them twice
  const lookedUpExchangeIdsRef = useRef(new Set<string>())
  const isMountedRef = useRef(false)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    // Nothing to look up in until the background has loaded the exchange list
    if (!exchangeListUpdatedAt) return

    const lookedUpExchangeIds = lookedUpExchangeIdsRef.current
    const unresolvedExchangeIds = [...new Set(exchangeIds)].filter(
      (exchangeId) => !lookedUpExchangeIds.has(exchangeId)
    )
    if (!unresolvedExchangeIds.length) return

    unresolvedExchangeIds.forEach((exchangeId) => lookedUpExchangeIds.add(exchangeId))
    dispatchAndWait<'getExchangesInfoAndSendResToUi', ExchangeInfoMap>({
      type: 'method',
      params: { method: 'getExchangesInfoAndSendResToUi', args: [unresolvedExchangeIds] }
    })
      .then((fetchedExchangesInfo) => {
        if (!isMountedRef.current || !Object.keys(fetchedExchangesInfo).length) return

        setExchangesInfo((prev) => ({ ...prev, ...fetchedExchangesInfo }))
      })
      .catch((error) => {
        // Lets the next change of ids retry them
        unresolvedExchangeIds.forEach((exchangeId) => lookedUpExchangeIds.delete(exchangeId))
        console.error('Failed to look up the exchanges info', error)
        captureException(error)
      })
  }, [dispatchAndWait, exchangeIds, exchangeListUpdatedAt])

  return exchangesInfo
}

export default useExchangesInfo
