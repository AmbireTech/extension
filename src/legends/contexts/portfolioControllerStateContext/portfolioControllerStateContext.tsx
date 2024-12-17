import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import useAccountContext from '@legends/hooks/useAccountContext'

export type AccountPortfolio = {
  amount?: number
  amountFormatted?: string
  isReady?: boolean
  error?: string
}

const PortfolioControllerStateContext = createContext<{
  accountPortfolio?: AccountPortfolio
  updateAccountPortfolio: (address: string) => void
}>({
  updateAccountPortfolio: () => {}
})

const PortfolioControllerStateProvider: React.FC<any> = ({ children }) => {
  const getPortfolioIntervalRef: any = useRef(null)
  const { connectedAccount, nonV2Account, isLoading } = useAccountContext()
  const [accountPortfolio, setAccountPortfolio] = useState<AccountPortfolio>()

  const updateAccountPortfolio = useCallback(async (): Promise<AccountPortfolio> => {
    if (!window.ambire) return { error: 'The Ambire extension is not installed!' }

    // Reset the portfolio to prevent displaying an outdated portfolio state for the previously connected account
    // while fetching the portfolio for the new account (address).
    setAccountPortfolio({ isReady: false })

    const portfolioRes = (await window.ambire.request({
      method: 'get_portfolioBalance',
      // TODO: impl a dynamic way of getting the chainIds
      params: [{ chainIds: ['0x1', '0x2105', '0xa', '0xa4b1', '0x82750'] }]
    })) as AccountPortfolio

    setAccountPortfolio(portfolioRes)
    return portfolioRes
  }, [])

  useEffect(() => {
    // While account is loading, we don't know yet what is the value of actual value of `nonV2Account`,
    if (isLoading) return

    if (!connectedAccount) return

    // Ensure there isn't already a scheduled timeout before setting a new one.
    if (getPortfolioIntervalRef.current) clearTimeout(getPortfolioIntervalRef.current)

    // We don't want to trigger a portfolio update (updateAccountPortfolio) for non v2 account
    if (nonV2Account) {
      return setAccountPortfolio((prevAccountPortfolio) => {
        // If the user switches to a non-V2 account and we already have the balance for the `connectedAccount`,
        // we want to display the balance of the `connectedAccount`.
        if (prevAccountPortfolio) return prevAccountPortfolio

        // If the balance of the `connectedAccount` has not been fetched, we simply show a placeholder balance for the `nonV2Account`,
        // as we do not want to display its actual balance.
        return {
          amount: 0,
          amountFormatted: '-',
          isReady: true
        }
      })
    }

    const runPortfolioContinuousUpdate = async () => {
      const portfolioRes = await updateAccountPortfolio()

      getPortfolioIntervalRef.current = setTimeout(
        runPortfolioContinuousUpdate,
        // Polling mechanism for fetching the extension's portfolio.
        // A polling mechanism is needed because we fetch the portfolio from multiple networks,
        // and when calling `get_portfolioBalance`, the portfolio might not be fully fetched,
        // resulting in a partial amount being returned (`isReady=false`).
        // To handle this, we retry fetching the portfolio until `isReady=true`,
        // with a 3-second delay between calls.
        // Whenever the portfolio `isReady=true` we keep it up to date by refetching it every 30 seconds
        portfolioRes.isReady ? 30000 : 3000
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    runPortfolioContinuousUpdate()

    return () => {
      clearTimeout(getPortfolioIntervalRef.current)
    }
  }, [isLoading, connectedAccount, nonV2Account, updateAccountPortfolio, setAccountPortfolio])

  return (
    <PortfolioControllerStateContext.Provider
      value={useMemo(
        () => ({
          accountPortfolio,
          updateAccountPortfolio
        }),
        [accountPortfolio, updateAccountPortfolio]
      )}
    >
      {children}
    </PortfolioControllerStateContext.Provider>
  )
}

export { PortfolioControllerStateProvider, PortfolioControllerStateContext }
