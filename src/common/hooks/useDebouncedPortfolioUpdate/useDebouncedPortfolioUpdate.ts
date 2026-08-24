import { useCallback, useEffect, useRef } from 'react'

import useController from '@common/hooks/useController'

const PORTFOLIO_UPDATE_DEBOUNCE_MS = 1000

/** Consecutive changes of the custom/hidden assets result in a single update */
const useDebouncedPortfolioUpdate = (): (() => void) => {
  const debouncedPortfolioUpdateInterval = useRef<NodeJS.Timeout | null>(null)
  const { dispatch: mainDispatch } = useController('MainController')

  useEffect(() => {
    return () => {
      if (debouncedPortfolioUpdateInterval.current) {
        clearTimeout(debouncedPortfolioUpdateInterval.current)
      }
    }
  }, [])

  return useCallback(() => {
    if (debouncedPortfolioUpdateInterval.current) {
      clearTimeout(debouncedPortfolioUpdateInterval.current)
    }

    debouncedPortfolioUpdateInterval.current = setTimeout(() => {
      mainDispatch({
        type: 'method',
        params: {
          method: 'updateSelectedAccountPortfolio',
          args: []
        }
      })
      debouncedPortfolioUpdateInterval.current = null
    }, PORTFOLIO_UPDATE_DEBOUNCE_MS)
  }, [mainDispatch])
}

export default useDebouncedPortfolioUpdate
