import { PortfolioController } from 'ambire-common/src/controllers/portfolio/portfolio'
import { TokenResult as TokenResultInterface } from 'ambire-common/src/libs/portfolio/interfaces'
import { formatUnits } from 'ethers'
import React, { createContext, useEffect, useMemo, useState } from 'react'

import { IdentityInfoResponse as IdentityInfoResponseInterface } from '@web/contexts/identityInfoContext'
import eventBus from '@web/extension-services/event/eventBus'
import useIdentityInfo from '@web/hooks/useIdentityInfo'
import useMainControllerState from '@web/hooks/useMainControllerState'

const PortfolioControllerStateContext = createContext<{
  accountPortfolio: {
    tokens: TokenResultInterface[]
    totalAmount: number
    isAllReady: boolean
  }
  state: PortfolioController
  gasTankAndRewardsData: IdentityInfoResponseInterface
}>({
  accountPortfolio: {
    tokens: [],
    totalAmount: 0,
    isAllReady: false
  },
  state: {},
  gasTankAndRewardsData: {}
})

const PortfolioControllerStateProvider: React.FC<any> = ({ children }) => {
  const mainCtrl = useMainControllerState()
  const { identityInfo, isIdentityInfoFetching } = useIdentityInfo()
  const [state, setState] = useState({} as PortfolioController)
  const [accountPortfolio, setAccountPortfolio] = useState({
    tokens: [],
    totalAmount: 0,
    isAllReady: true
  })

  // Calculate Gas Tank Balance Sum
  const gasTankBalance = useMemo(
    () =>
      (!isIdentityInfoFetching &&
        identityInfo &&
        identityInfo?.gasTank?.balance.reduce((total, token) => {
          const priceInUSD = token.priceIn.find(({ baseCurrency }: any) => baseCurrency === 'usd')
          if (priceInUSD) {
            const balance: any = formatUnits(BigInt(token.amount), token.decimals)
            const balanceUSD = priceInUSD.price * balance
            return total + balanceUSD
          }
          return total
        }, 0)) ||
      0,
    [isIdentityInfoFetching, identityInfo]
  )

  // Calculate Rewards Balance Sum with the TotalBalance
  const rewardsBalance = useMemo(() => {
    if (!isIdentityInfoFetching && identityInfo && identityInfo.rewards) {
      let walletClaimableBalance = 0
      if (identityInfo.rewards.walletClaimableBalance) {
        const { amount, decimals, priceIn }: TokenResultInterface =
          identityInfo.rewards.walletClaimableBalance
        const usdPrice = priceIn.find(({ baseCurrency }: any) => baseCurrency === 'usd')?.price || 0
        const formattedAmount = formatUnits(BigInt(amount), decimals)
        walletClaimableBalance = parseFloat(formattedAmount) * usdPrice || 0
      }

      let xWalletClaimableBalance = 0
      if (identityInfo.rewards.xWalletClaimableBalance) {
        const { amount, decimals, priceIn }: TokenResultInterface =
          identityInfo.rewards.xWalletClaimableBalance
        const usdPrice = priceIn.find(({ baseCurrency }: any) => baseCurrency === 'usd')?.price || 0
        const formattedAmount = formatUnits(BigInt(amount), decimals)
        xWalletClaimableBalance = parseFloat(formattedAmount) * usdPrice || 0
      }

      return walletClaimableBalance + xWalletClaimableBalance
    }

    return 0
  }, [isIdentityInfoFetching, identityInfo])

  useEffect(() => {
    // Function to calculate account portfolio summary
    const calculateAccountPortfolio = () => {
      const updatedTokens: any = []
      const updatedTotalAmount = accountPortfolio.totalAmount
      let newTotalAmount: number = gasTankBalance
      let allReady = true

      if (!mainCtrl.selectedAccount || !state.latest || !state.latest[mainCtrl.selectedAccount]) {
        setAccountPortfolio({
          tokens: updatedTokens,
          totalAmount: updatedTotalAmount,
          isAllReady: allReady
        })
        return
      }

      const selectedAccountData = state.latest[mainCtrl.selectedAccount]
      // Convert the object keys to an array and iterate using forEach
      Object.keys(selectedAccountData).forEach((network) => {
        const networkData = selectedAccountData[network]

        if (networkData && networkData.isReady && !networkData.isLoading && networkData.result) {
          // In the case we receive BigInt here, convert to number
          const networkTotal = Number(networkData.result.total?.usd) || 0
          newTotalAmount += networkTotal

          // Assuming you want to push tokens to updatedTokens array as well
          const networkTokens = networkData.result.tokens
          updatedTokens.push(...networkTokens)
          if (networkTokens.length) {
            setAccountPortfolio((prev) => ({
              ...prev,
              tokens: updatedTokens
            }))
          }
        } else if (networkData && networkData.isReady && networkData.isLoading) {
          // Handle the case where network is ready but still loading
          allReady = false
        }
      })

      setAccountPortfolio((prev) => ({
        ...prev,
        totalAmount: newTotalAmount,
        isAllReady: allReady && !isIdentityInfoFetching
      }))
    }

    // Calculate account portfolio summary
    calculateAccountPortfolio()
  }, [
    mainCtrl.selectedAccount,
    state,
    isIdentityInfoFetching,
    gasTankBalance,
    accountPortfolio.totalAmount
  ])

  useEffect(() => {
    const onUpdate = (newState: PortfolioController) => {
      setState(newState)
    }

    eventBus.addEventListener('portfolio', onUpdate)

    return () => eventBus.removeEventListener('portfolio', onUpdate)
  }, [])

  return (
    <PortfolioControllerStateContext.Provider
      value={useMemo(
        () => ({
          state,
          gasTankAndRewardsData: identityInfo,
          accountPortfolio
        }),
        [state, accountPortfolio, identityInfo]
      )}
    >
      {children}
    </PortfolioControllerStateContext.Provider>
  )
}

export { PortfolioControllerStateProvider, PortfolioControllerStateContext }
