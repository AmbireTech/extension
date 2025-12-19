import { Contract, formatEther, formatUnits } from 'ethers'
import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { STK_WALLET, WALLET_TOKEN } from '@ambire-common/consts/addresses'
import { networks } from '@ambire-common/consts/networks'
import { getUniV3Positions } from '@ambire-common/libs/defiPositions/providers'
import {
  PortfolioProjectedRewardsResult,
  PortfolioRewardsResult,
  ProjectedRewardsStats
} from '@ambire-common/libs/portfolio/interfaces'
import { getRpcProvider } from '@ambire-common/services/provider'
import { calculateRewardsStats } from '@ambire-common/utils/rewards'
import { RELAYER_URL } from '@env'
import { LEGENDS_SUPPORTED_NETWORKS_BY_CHAIN_ID } from '@legends/constants/networks'
import useAccountContext from '@legends/hooks/useAccountContext'
import useProviderContext from '@legends/hooks/useProviderContext'

export type AccountPortfolio = {
  amount?: number
  amountFormatted?: string
  isReady?: boolean
  error?: string
}
export type ClaimableRewards = {
  address: string
  symbol: string
  amount: string
  decimals: number
  networkId: string
  chainId: number
  priceIn: Array<{
    baseCurrency: string
    price: number
  }>
}

type WalletTokenInfo = {
  maxSupply: number
  circulatingSupply: number
  totalSupply: number
  stkWalletTotalSupply: number
  percentageStakedWallet: number
  apy: number
  stakedWallets: number
  walletPrice: number
  season2PoolInfo: {
    poolSize: number
    totalVolumeSwapAndBridge: number
  }
} | null

const PortfolioControllerStateContext = createContext<{
  accountPortfolio?: AccountPortfolio
  updateAccountPortfolio: () => void
  claimableRewardsError: string | null
  claimableRewards: ClaimableRewards | null
  isLoadingClaimableRewards: boolean
  walletTokenInfo: WalletTokenInfo
  walletTokenPrice: number | null
  isLoadingWalletTokenInfo: boolean
  rewardsProjectionData: PortfolioProjectedRewardsResult | null
  userRewardsStats: ProjectedRewardsStats | null
  xWalletClaimableBalance: PortfolioRewardsResult['xWalletClaimableBalance'] | null
}>({
  updateAccountPortfolio: () => {},
  claimableRewardsError: null,
  claimableRewards: null,
  isLoadingClaimableRewards: true,
  walletTokenInfo: null,
  walletTokenPrice: null,
  isLoadingWalletTokenInfo: true,
  userRewardsStats: null,
  rewardsProjectionData: null,
  xWalletClaimableBalance: null
})

const ethereumProvider = getRpcProvider(['https://invictus.ambire.com/ethereum'], 1n)

const stkWalletContract = new Contract(
  STK_WALLET,
  ['function balanceOf(address) public view returns (uint256)'],
  ethereumProvider as any
)

const PortfolioControllerStateProvider: React.FC<any> = ({ children }) => {
  const getPortfolioIntervalRef: any = useRef(null)
  const { provider } = useProviderContext()
  const { connectedAccount, v1Account, isLoading } = useAccountContext()
  const [accountPortfolio, setAccountPortfolio] = useState<AccountPortfolio>()
  const [ethTokenPrice, setEthTokenPrice] = useState<number>()
  const [uniswapWalletPosition, setUniswapWalletPosition] =
    useState<{ wallet: number; eth: number }>()
  const [stkBalance, setStkBalance] = useState<number>()
  const [claimableRewards, setClaimableRewards] = useState<any>(null)
  const [isLoadingPortfolioProjectionData, setIsLoadingPortfolioProjectionData] = useState(true)
  const [isLoadingUniPositions, setIsLoadingUniPositions] = useState(true)
  const [isLoadingStkBalance, setIsLoadingStkBalance] = useState(true)
  const [claimableRewardsError, setClaimableRewardsError] = useState<string | null>(null)
  const [xWalletClaimableBalance, setXWalletClaimableBalance] = useState<
    PortfolioRewardsResult['xWalletClaimableBalance'] | null
  >(null)

  const [isLoadingWalletTokenInfo, setIsLoadingWalletTokenInfo] = useState(true)
  const [walletTokenInfo, setWalletTokenInfo] = useState<WalletTokenInfo>(null)
  const [walletTokenPrice, setWalletTokenPrice] = useState<number | null>(null)
  const [rewardsProjectionData, setRewardsProjectionData] =
    useState<PortfolioProjectedRewardsResult | null>(null)

  const updateAdditionalPortfolio = useCallback(async () => {
    if (!connectedAccount) {
      setIsLoadingPortfolioProjectionData(false)
      return
    }
    try {
      setIsLoadingPortfolioProjectionData(true)
      const additionalPortfolioResponse = await fetch(
        `${RELAYER_URL}/v2/identity/${connectedAccount}/portfolio-additional`
      )

      const additionalPortfolioJson = await additionalPortfolioResponse.json()
      const xWalletClaimableBalanceData =
        additionalPortfolioJson?.data?.rewards?.xWalletClaimableBalance
      const claimableBalance = additionalPortfolioJson?.data?.rewards?.stkWalletClaimableBalance
      const walletTokenInfoData =
        additionalPortfolioJson?.data?.gasTank?.availableGasTankAssets.find(
          (asset: any) => asset.address === WALLET_TOKEN
        )
      const ethPrice = additionalPortfolioJson?.data?.gasTank?.availableGasTankAssets.find(
        (asset: any) => asset.symbol === 'eth'
      )?.price
      setWalletTokenPrice(walletTokenInfoData.price)
      setEthTokenPrice(ethPrice)
      setRewardsProjectionData(additionalPortfolioJson?.data?.rewardsProjectionDataV2)
      setClaimableRewards(claimableBalance)
      setXWalletClaimableBalance(xWalletClaimableBalanceData)
      setIsLoadingPortfolioProjectionData(false)
    } catch (e) {
      console.error('Error fetching additional portfolio:', e)
      setIsLoadingPortfolioProjectionData(false)
      setClaimableRewards(null)
      setClaimableRewardsError('Error fetching claimable data')
    }
  }, [connectedAccount])

  const updateStkBalance = useCallback(async () => {
    if (!connectedAccount) {
      setIsLoadingStkBalance(false)
      return
    }
    setIsLoadingStkBalance(true)
    stkWalletContract.balanceOf!(connectedAccount)
      .then((stkBalanceBigint) => setStkBalance(Number(formatUnits(stkBalanceBigint))))
      .catch((e) => {
        console.error('Failed to fetch stk wallet price', e)
        return null
      })
      .finally(() => {
        setIsLoadingStkBalance(false)
      })
  }, [connectedAccount])

  const updateUniswapPositions = useCallback(async () => {
    if (!connectedAccount) {
      setIsLoadingUniPositions(false)
      return
    }

    try {
      setIsLoadingUniPositions(true)
      const uniV3Positions = await getUniV3Positions(
        connectedAccount,
        ethereumProvider as unknown as Parameters<typeof getUniV3Positions>[1],
        networks.find((n) => n.chainId === 1n)!
      )
      const walletEthPositionsAssets = uniV3Positions?.positions
        .filter((p) => p.additionalData.inRange)
        .filter(
          (p) =>
            p.assets.some((a) => a.symbol === 'WALLET') && p.assets.some((a) => a.symbol === 'WETH')
        )
        .map((p) => p.assets)
        .flat()
      if (!walletEthPositionsAssets) return
      const newAmounts = {
        wallet: walletEthPositionsAssets
          ?.filter((a) => a.symbol === 'WALLET')
          .map((a) => Number(formatEther(a.amount)))
          .reduce((a, b) => a + b, 0),
        eth: walletEthPositionsAssets
          ?.filter((a) => a.symbol === 'WETH')
          .map((a) => Number(formatEther(a.amount)))
          .reduce((a, b) => a + b, 0)
      }
      setUniswapWalletPosition(newAmounts)
      setIsLoadingUniPositions(false)
    } catch (e) {
      setIsLoadingUniPositions(false)
      console.error('Error fetching uniswap positions:', e)
    }
  }, [connectedAccount])

  const updateAccountPortfolio = useCallback(async () => {
    if (!provider)
      return setAccountPortfolio({
        error: 'The Ambire extension is not installed!',
        isReady: false
      })

    // While account is loading, we don't know yet what is the value of actual value of `nonV2Account`
    if (isLoading) return

    // Ensure there isn't already a scheduled timeout before setting a new one.
    if (getPortfolioIntervalRef.current) clearTimeout(getPortfolioIntervalRef.current)

    // We don't want to trigger a portfolio update (updateAccountPortfolio) for non v2 account
    if (v1Account && !connectedAccount) {
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

    // Polling mechanism for fetching the extension's portfolio.
    // A polling mechanism is needed because we fetch the portfolio from multiple networks,
    // and when calling `get_portfolioBalance`, the portfolio might not be fully fetched,
    // resulting in a partial amount being returned (`isReady=false`).
    // To handle this, we retry fetching the portfolio until `isReady=true`,
    // with a 3-second delay between calls.
    const getPortfolioTillReady = async () => {
      // Reset the portfolio to prevent displaying an outdated portfolio state for the previously connected account
      // while fetching the portfolio for the new account (address).
      setAccountPortfolio({ isReady: false })

      const portfolioRes = (await provider.request({
        method: 'get_portfolioBalance',
        // TODO: impl a dynamic way of getting the chainIds
        params: [
          { chainIds: LEGENDS_SUPPORTED_NETWORKS_BY_CHAIN_ID.map((n) => `0x${n.toString(16)}`) }
        ]
      })) as AccountPortfolio

      if (portfolioRes.isReady) {
        return setAccountPortfolio(portfolioRes)
      }

      getPortfolioIntervalRef.current = setTimeout(getPortfolioTillReady, 3000)
    }

    await getPortfolioTillReady()
  }, [provider, isLoading, connectedAccount, v1Account])

  const fetchWalletTokenInfo = useCallback(async () => {
    try {
      setIsLoadingWalletTokenInfo(true)
      const response = await fetch(`${RELAYER_URL}/wallet-token/info`)
      if (!response.ok) throw new Error('Failed to fetch wallet token info')
      const data = await response.json()
      setWalletTokenInfo(data)
      setIsLoadingWalletTokenInfo(false)
    } catch (error) {
      console.error('Error fetching wallet token info:', error)
      setWalletTokenInfo(null)
      setIsLoadingWalletTokenInfo(false)
    }
  }, [])

  const isLoadingClaimableRewards = useMemo(() => {
    return (
      isLoadingPortfolioProjectionData ||
      isLoadingUniPositions ||
      isLoadingStkBalance ||
      !accountPortfolio?.isReady
    )
  }, [
    isLoadingPortfolioProjectionData,
    isLoadingUniPositions,
    isLoadingStkBalance,
    accountPortfolio?.isReady
  ])

  const userRewardsStats = useMemo(() => {
    if (!rewardsProjectionData || walletTokenPrice === null || isLoadingClaimableRewards)
      return null

    const liquidityUSD =
      ethTokenPrice === undefined || uniswapWalletPosition === undefined
        ? undefined
        : uniswapWalletPosition.eth * ethTokenPrice +
          uniswapWalletPosition.wallet * walletTokenPrice

    const stkBalanceUSD = stkBalance === undefined ? undefined : stkBalance * walletTokenPrice

    return calculateRewardsStats(
      rewardsProjectionData,
      walletTokenPrice,
      accountPortfolio?.amount,
      stkBalanceUSD,
      liquidityUSD
    )
  }, [
    accountPortfolio?.amount,
    ethTokenPrice,
    isLoadingClaimableRewards,
    rewardsProjectionData,
    stkBalance,
    uniswapWalletPosition,
    walletTokenPrice
  ])

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    updateAdditionalPortfolio()
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    fetchWalletTokenInfo()
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    updateStkBalance()
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    updateUniswapPositions()
  }, [updateAdditionalPortfolio, fetchWalletTokenInfo, updateStkBalance, updateUniswapPositions])

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    updateAccountPortfolio()
    return () => {
      clearTimeout(getPortfolioIntervalRef.current)
    }
  }, [updateAccountPortfolio])

  return (
    <PortfolioControllerStateContext.Provider
      value={useMemo(
        () => ({
          accountPortfolio,
          updateAccountPortfolio,
          claimableRewardsError,
          claimableRewards,
          isLoadingClaimableRewards,
          isLoadingWalletTokenInfo,
          xWalletClaimableBalance,
          walletTokenInfo,
          walletTokenPrice,
          rewardsProjectionData,
          userRewardsStats
        }),
        [
          accountPortfolio,
          updateAccountPortfolio,
          claimableRewards,
          claimableRewardsError,
          isLoadingClaimableRewards,
          isLoadingWalletTokenInfo,
          xWalletClaimableBalance,
          walletTokenInfo,
          walletTokenPrice,
          rewardsProjectionData,
          userRewardsStats
        ]
      )}
    >
      {children}
    </PortfolioControllerStateContext.Provider>
  )
}

export { PortfolioControllerStateProvider, PortfolioControllerStateContext }

function usePortfolioControllerState() {
  const context = React.useContext(PortfolioControllerStateContext)
  if (context === undefined) {
    throw new Error(
      'usePortfolioControllerState must be used within PortfolioControllerStateProvider'
    )
  }
  return context
}

export default usePortfolioControllerState
