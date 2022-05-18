// TODO: add types
import supportedProtocols from 'ambire-common/src/constants/supportedProtocols'
import {
  setKnownAddresses,
  setKnownTokens
} from 'ambire-common/src/services/humanReadableTransactions'
// TODO: fix ignored linter warnings
import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AppState } from 'react-native'

import CONFIG from '@config/env'
import i18n from '@config/localization/localization'
import useAccounts from '@modules/common/hooks/useAccounts'
import useNetwork from '@modules/common/hooks/useNetwork'
import useToast from '@modules/common/hooks/useToast'
import {
  checkTokenList,
  getTokenListBalance,
  tokenList
} from '@modules/common/services/balanceOracle'
import { fetchGet } from '@modules/common/services/fetch'
import AsyncStorage from '@react-native-async-storage/async-storage'

type Token = {
  account: string
  address: string
  balance: string
  balanceRaw: string
  decimals: number
  name: string
  network: string
  symbol: string
  tokenImageUrl: string
}

type PortfolioContextData = {
  isBalanceLoading: boolean
  areProtocolsLoading: boolean
  balance: any
  otherBalances: any
  tokens: any
  protocols: any
  collectibles: any
  requestOtherProtocolsRefresh: () => void
  refreshTokensIfVisible: () => void
  onAddExtraToken: (token: Token) => void
  loadBalance: () => void
  loadProtocols: () => void
}

const PortfolioContext = createContext<PortfolioContextData>({
  isBalanceLoading: true,
  areProtocolsLoading: true,
  balance: {
    total: {
      full: 0,
      truncated: 0,
      decimals: '00'
    },
    tokens: []
  },
  otherBalances: [],
  tokens: [],
  protocols: [],
  collectibles: [],
  requestOtherProtocolsRefresh: () => {},
  refreshTokensIfVisible: () => {},
  onAddExtraToken: () => {},
  loadBalance: () => {},
  loadProtocols: () => {}
})

const getBalances = (apiKey: any, network: any, protocol: any, address: any, provider?: any) =>
  fetchGet(
    `${
      provider === 'velcro' ? CONFIG.VELCRO_API_ENDPOINT : CONFIG.ZAPPER_API_ENDPOINT
    }/protocols/${protocol}/balances?addresses[]=${address}&network=${network}&api_key=${apiKey}&newBalances=true`
  )

let lastOtherProtocolsRefresh: any = null

// use Balance Oracle
function paginateArray(input: any, limit: any) {
  const pages = []
  let from = 0
  for (let i = 1; i <= Math.ceil(input.length / limit); i++) {
    pages.push(input.slice(from, i * limit))
    from += limit
  }
  return pages
}

async function supplementTokensDataFromNetwork({
  walletAddr,
  network,
  tokensData,
  extraTokens,
  updateBalance
}: any) {
  if (!walletAddr || walletAddr === '' || !network || network === '') return []
  // eslint-disable-next-line no-param-reassign
  if (!tokensData || !tokensData[0]) tokensData = checkTokenList(tokensData || []) // tokensData check and populate for test if undefind
  // eslint-disable-next-line no-param-reassign
  if (!extraTokens || !extraTokens[0]) extraTokens = checkTokenList(extraTokens || []) // extraTokens check and populate for test if undefind

  // concat predefined token list with extraTokens list (extraTokens are certainly ERC20)
  const fullTokenList = [
    // @ts-ignore
    ...new Set(tokenList[network] ? tokenList[network].concat(extraTokens) : [...extraTokens])
  ]
  const tokens = fullTokenList.map((t: any) => {
    return tokensData.find((td: any) => td.address === t.address) || t
  })
  const tokensNotInList = tokensData.filter((td: any) => {
    return !tokens.some((t) => t.address === td.address)
  })

  // tokensNotInList: call separately to prevent errors from non-erc20 tokens
  // NOTE about err handling: errors are caught for each call in balanceOracle, and we retain the original token entry, which contains the balance
  const calls = paginateArray([...new Set(tokens)], 100).concat(paginateArray(tokensNotInList, 100))

  const tokenBalances = (
    await Promise.all(
      calls.map((callTokens) => {
        return getTokenListBalance({ walletAddr, tokens: callTokens, network, updateBalance })
      })
    )
  ).flat()
  return tokenBalances
}

const PortfolioProvider: React.FC = ({ children }) => {
  const currentAccount = useRef()
  const appState = useRef(AppState.currentState)

  const { addToast } = useToast()

  const [appStateVisible, setAppStateVisible] = useState<any>(appState.current)
  const [isBalanceLoading, setBalanceLoading] = useState<any>(true)
  const [areProtocolsLoading, setProtocolsLoading] = useState<any>(true)

  const [tokensByNetworks, setTokensByNetworks] = useState<any>([])
  const [otherProtocolsByNetworks, setOtherProtocolsByNetworks] = useState(
    supportedProtocols.filter((item) => !item.protocols || !item.protocols.length)
  )

  const [balance, setBalance] = useState<any>({
    total: {
      full: 0,
      truncated: 0,
      decimals: '00'
    },
    tokens: []
  })
  const [otherBalances, setOtherBalances] = useState<any>([])
  const [tokens, setTokens] = useState<any>([])
  const [protocols, setProtocols] = useState<any>([])
  const [collectibles, setCollectibles] = useState<any>([])
  const [extraTokens, setExtraTokens] = useState<any>([])

  const { network: selectedNetwork } = useNetwork()
  const currentNetwork = selectedNetwork?.id
  const { selectedAcc: account } = useAccounts()

  useEffect(() => {
    ;(async () => {
      const storedExtraTokens = await AsyncStorage.getItem('extraTokens')
      setExtraTokens(storedExtraTokens ? JSON.parse(storedExtraTokens) : [])
    })()
  }, [])

  const getExtraTokensAssets = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-shadow
    (account: any, network: any) =>
      extraTokens
        .filter((extra: any) => extra.account === account && extra.network === network)
        .map((extraToken: any) => ({
          ...extraToken,
          type: 'base',
          price: 0,
          balanceUSD: 0,
          isExtraToken: true
        })),
    [extraTokens]
  )

  const fetchTokens = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-shadow
    async (account, currentNetwork = false) => {
      try {
        const networks = currentNetwork
          ? [supportedProtocols.find(({ network }) => network === currentNetwork)]
          : supportedProtocols

        let failedRequests = 0
        const requestsCount = networks.length

        const updatedTokens = (
          await Promise.all(
            networks.map(async ({ network, balancesProvider }: any) => {
              try {
                // eslint-disable-next-line @typescript-eslint/no-shadow
                const balance = await getBalances(
                  CONFIG.ZAPPER_API_KEY,
                  network,
                  'tokens',
                  account,
                  balancesProvider
                )
                if (!balance) return null

                const { meta, products }: any = Object.values(balance)[0]
                const extraTokensAssets = getExtraTokensAssets(account, network) // Add user added extra token to handle
                const assets = [
                  ...products
                    // eslint-disable-next-line @typescript-eslint/no-shadow
                    .map(({ assets }: any) => assets.map(({ tokens }: any) => tokens))
                    .flat(2),
                  ...extraTokensAssets
                ]

                return {
                  network,
                  meta,
                  assets
                }
              } catch (e) {
                console.error('Balances API error', e)
                failedRequests++
              }
            })
          )
        ).filter((data) => data)
        const updatedNetworks = updatedTokens.map(({ network }: any) => network)

        // Prevent race conditions
        if (currentAccount.current !== account) return

        // eslint-disable-next-line @typescript-eslint/no-shadow
        setTokensByNetworks((tokensByNetworks: any) => [
          ...tokensByNetworks.filter(({ network }: any) => !updatedNetworks.includes(network)),
          ...updatedTokens
        ])

        if (failedRequests >= requestsCount) throw new Error('Failed to fetch Tokens from API')
        return true
      } catch (error: any) {
        addToast(error.message, { error: true })
        return false
      }
    },
    [getExtraTokensAssets]
  )

  // eslint-disable-next-line @typescript-eslint/no-shadow
  const fetchOtherProtocols = useCallback(async (account, currentNetwork = false) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-shadow
      const protocols = currentNetwork
        ? [supportedProtocols.find(({ network }) => network === currentNetwork)]
        : supportedProtocols

      let failedRequests = 0
      const requestsCount = protocols.reduce(
        // eslint-disable-next-line no-unsafe-optional-chaining
        (acc: any, curr: any) => curr?.protocols?.length + acc,
        0
      )

      const updatedProtocols = (
        await Promise.all(
          // eslint-disable-next-line @typescript-eslint/no-shadow
          protocols.map(async ({ network, protocols, nftsProvider }: any) => {
            const all = (
              await Promise.all(
                protocols.map(async (protocol: any) => {
                  try {
                    // eslint-disable-next-line @typescript-eslint/no-shadow
                    const balance = await getBalances(
                      CONFIG.ZAPPER_API_KEY,
                      network,
                      protocol,
                      account,
                      protocol === 'nft' ? nftsProvider : null
                    )
                    return balance ? Object.values(balance)[0] : null
                  } catch (e) {
                    failedRequests++
                  }
                })
              )
            )
              .filter((data) => data)
              .flat()

            return all.length
              ? {
                  network,
                  protocols: all
                    .map(({ products }) =>
                      products.map(({ label, assets }: any) => ({
                        label,
                        // eslint-disable-next-line @typescript-eslint/no-shadow
                        assets: assets.map(({ tokens }: any) => tokens).flat(1)
                      }))
                    )
                    .flat(2)
                }
              : null
          })
        )
      ).filter((data) => data)
      const updatedNetworks = updatedProtocols.map(({ network }: any) => network)

      // Prevent race conditions
      if (currentAccount.current !== account) return

      setOtherProtocolsByNetworks((protocolsByNetworks: any) => [
        ...protocolsByNetworks.filter(({ network }: any) => !updatedNetworks.includes(network)),
        ...updatedProtocols
      ])

      lastOtherProtocolsRefresh = Date.now()

      if (failedRequests >= requestsCount)
        throw new Error('Failed to fetch other Protocols from API')
      return true
    } catch (error: any) {
      addToast(error.message, { error: true })
      return false
    }
  }, [])

  const refreshTokensIfVisible = useCallback(() => {
    if (!account) return
    if (!isBalanceLoading) fetchTokens(account, currentNetwork)
  }, [isBalanceLoading, account, fetchTokens, currentNetwork, appStateVisible])

  const requestOtherProtocolsRefresh = async () => {
    if (!account) return
    if (Date.now() - lastOtherProtocolsRefresh > 30000 && !areProtocolsLoading)
      await fetchOtherProtocols(account, currentNetwork)
  }

  // Make humanizer 'learn' about new tokens and aliases
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const updateHumanizerData = (tokensByNetworks: any) => {
    const tokensList = Object.values(tokensByNetworks)
      .map(({ assets }: any) => assets)
      .flat(1)
    const knownAliases = tokensList.map(({ address, symbol }) => ({ address, name: symbol }))
    setKnownAddresses(knownAliases)
    setKnownTokens(tokensList)
  }

  const onAddExtraToken = (extraToken: any) => {
    const { address, name, symbol } = extraToken
    // eslint-disable-next-line @typescript-eslint/no-shadow
    if (extraTokens.map(({ address }: any) => address).includes(address))
      return addToast(
        i18n.t('{{name}} ({{symbol}}) is already added to your wallet.', { name, symbol }) as string
      )
    if (
      Object.values(tokenList)
        .flat(1)
        // eslint-disable-next-line @typescript-eslint/no-shadow
        .map(({ address }: any) => address)
        .includes(address)
    )
      return addToast(
        i18n.t('{{name}} ({{symbol}}) is already handled by your wallet.', {
          name,
          symbol
        }) as string
      )
    // eslint-disable-next-line @typescript-eslint/no-shadow
    if (tokens.map(({ address }: any) => address).includes(address))
      return addToast(
        i18n.t('{{name}} ({{symbol}}) is already added to your wallet.', { name, symbol }) as string
      )

    const updatedExtraTokens = [
      ...extraTokens,
      {
        ...extraToken,
        coingeckoId: null
      }
    ]

    AsyncStorage.setItem('extraTokens', JSON.stringify(updatedExtraTokens))
    setExtraTokens(updatedExtraTokens)
    addToast(
      i18n.t('{{name}} ({{symbol}}) token added to your wallet!', { name, symbol }) as string
    )
  }

  const removeDuplicatedAssets = (tokens) => {
    const lookup = tokens.reduce((a, e) => {
      a[e.address] = ++a[e.address] || 0
      return a
    }, {})

    // filters by non duplicated objects or takes the one of dup but with a price greater than 0
    tokens = tokens.filter((e) => !lookup[e.address] || (lookup[e.address] && e.price))

    return tokens
  }

  async function loadBalance() {
    if (!account) return
    setBalanceLoading(true)
    if (await fetchTokens(account)) setBalanceLoading(false)
  }

  async function loadProtocols() {
    if (!account) return
    setProtocolsLoading(true)
    if (await fetchOtherProtocols(account)) setProtocolsLoading(false)
  }

  // Fetch balances and protocols on account change
  useEffect(() => {
    currentAccount.current = account

    loadBalance()
    loadProtocols()
  }, [account, fetchTokens, fetchOtherProtocols])

  // Update states on network, tokens and otherProtocols change
  useEffect(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-shadow
      const tokens = tokensByNetworks.find(({ network }: any) => network === currentNetwork)

      if (tokens) {
        tokens.assets = removeDuplicatedAssets(tokens.assets)
        setTokens(tokens.assets)
      }

      const balanceByNetworks = tokensByNetworks.map(({ network, meta, assets }: any) => {
        const totalUSD = assets.reduce((acc: any, curr: any) => acc + curr.balanceUSD, 0)
        // eslint-disable-next-line no-unsafe-optional-chaining
        const balanceUSD = totalUSD + meta.find(({ label }: any) => label === 'Debt')?.value
        if (!balanceUSD)
          return {
            network,
            total: {
              full: 0,
              truncated: 0,
              decimals: '00'
            }
          }

        const [truncated, decimals] = Number(balanceUSD.toString()).toFixed(2).split('.')
        return {
          network,
          total: {
            full: balanceUSD,
            truncated: Number(truncated).toLocaleString('en-US'),
            decimals
          }
        }
      })

      // eslint-disable-next-line @typescript-eslint/no-shadow
      const balance = balanceByNetworks.find(({ network }: any) => network === currentNetwork)
      if (balance) {
        setBalance(balance)
        setOtherBalances(balanceByNetworks.filter(({ network }: any) => network !== currentNetwork))
      }

      updateHumanizerData(tokensByNetworks)

      const otherProtocols = otherProtocolsByNetworks.find(
        ({ network }: any) => network === currentNetwork
      )
      if (tokens && otherProtocols) {
        setProtocols([
          {
            label: 'Tokens',
            assets: tokens.assets
          },
          ...otherProtocols.protocols.filter(({ label }: any) => label !== 'NFTs')
        ])
        setCollectibles(
          otherProtocols.protocols.find(({ label }: any) => label === 'NFTs')?.assets || []
        )
      }
    } catch (e: any) {
      console.error(e)
      addToast(e.message || e, { error: true })
    }
  }, [currentNetwork, tokensByNetworks, otherProtocolsByNetworks])

  // Refresh tokens on network change
  useEffect(() => {
    if (appStateVisible === 'active') {
      refreshTokensIfVisible()
    }
  }, [currentNetwork, refreshTokensIfVisible])

  // Refresh balance every 80s if visible
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (appStateVisible === 'active') {
        refreshTokensIfVisible()
      }
    }, 90000)
    return () => clearInterval(refreshInterval)
  }, [refreshTokensIfVisible])

  // Get supplement tokens data every 20s
  useEffect(() => {
    const getSupplementTokenData = async () => {
      const currentNetworkTokens = tokensByNetworks.find(
        ({ network }: any) => network === currentNetwork
      )
      if (!currentNetworkTokens) return

      const extraTokensAssets = getExtraTokensAssets(account, currentNetwork)
      try {
        const rcpTokenData = await supplementTokensDataFromNetwork({
          walletAddr: account,
          network: currentNetwork,
          tokensData: currentNetworkTokens.assets.filter(({ isExtraToken }: any) => !isExtraToken), // Filter out extraTokens
          extraTokens: extraTokensAssets
        })
        currentNetworkTokens.assets = rcpTokenData

        // Update stored extraTokens with new rpc data
        // @TODO this seems unnecessary but we'll have to analyze it again
        const storedExtraTokens = (await AsyncStorage.getItem('extraTokens')) || '[]'
        const parsedStoredExtraTokens = JSON.parse(storedExtraTokens)
        const updatedExtraTokens = rcpTokenData
          .map((updated) => {
            const extraToken = parsedStoredExtraTokens.find(
              (extra: any) =>
                extra.address === updated.address &&
                extra.network === updated.network &&
                extra.account === account
            )
            if (!extraToken) return null
            return {
              ...extraToken,
              ...updated
            }
          })
          .filter((updated) => updated)

        AsyncStorage.setItem('extraTokens', JSON.stringify(updatedExtraTokens))

        setTokensByNetworks([
          ...tokensByNetworks.filter(({ network }: any) => network !== currentNetwork),
          currentNetworkTokens
        ])
      } catch (e) {
        console.error('supplementTokensDataFromNetwork failed', e)
      }
    }
    const refreshInterval = setInterval(getSupplementTokenData, 20000)
    return () => clearInterval(refreshInterval)
  }, [
    account,
    currentNetwork,
    isBalanceLoading,
    fetchTokens,
    tokensByNetworks,
    extraTokens,
    getExtraTokensAssets
  ])

  // Refresh balance when app is focused
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        refreshTokensIfVisible()
      }

      appState.current = nextAppState
      setAppStateVisible(appState.current)
    })
    return () => {
      try {
        subscription?.remove()
      } catch (error) {
        console.log('App state unsubscribe failed')
      }
    }
  }, [])

  return (
    <PortfolioContext.Provider
      value={useMemo(
        () => ({
          isBalanceLoading,
          areProtocolsLoading,
          balance,
          otherBalances,
          tokens,
          protocols,
          collectibles,
          requestOtherProtocolsRefresh,
          refreshTokensIfVisible,
          onAddExtraToken,
          loadBalance,
          loadProtocols
        }),
        [
          isBalanceLoading,
          areProtocolsLoading,
          balance,
          otherBalances,
          tokens,
          protocols,
          collectibles,
          requestOtherProtocolsRefresh,
          refreshTokensIfVisible,
          onAddExtraToken
        ]
      )}
    >
      {children}
    </PortfolioContext.Provider>
  )
}

export { PortfolioContext, PortfolioProvider }
