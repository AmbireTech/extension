import AAVELendingPoolProviders from 'ambire-common/src/constants/AAVELendingPoolProviders'
import AAVELendingPoolAbi from 'ambire-common/src/constants/abis/AAVELendingPoolAbi'
import networks, { NetworkId } from 'ambire-common/src/constants/networks'
import { UseAccountsReturnType } from 'ambire-common/src/hooks/useAccounts'
import { UsePortfolioReturnType } from 'ambire-common/src/hooks/usePortfolio/types'
import { UseToastsReturnType } from 'ambire-common/src/hooks/useToasts'
import approveToken from 'ambire-common/src/services/approveToken'
import { getProvider } from 'ambire-common/src/services/provider'
import { ethers } from 'ethers'
import { Interface } from 'ethers/lib/utils'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import isEqual from 'react-fast-compare'

import AAVELogo from '@common/assets/images/AAVE.png'
import { useTranslation } from '@common/config/localization'
import Card from '@common/modules/earn/components/Card'
import { CARDS } from '@common/modules/earn/contexts/cardsVisibilityContext'
import { getDefaultTokensItems } from '@common/modules/earn/services/defaultTokens'

const AAVELendingPool = new Interface(AAVELendingPoolAbi)
const RAY = 10 ** 27
let lendingPoolAddress: any = null

interface Props {
  tokens: UsePortfolioReturnType['tokens']
  networkId?: NetworkId
  selectedAcc: UseAccountsReturnType['selectedAcc']
  addRequest: (req: any) => any
  addToast: UseToastsReturnType['addToast']
}

const AAVECard = ({ tokens, networkId, selectedAcc, addRequest, addToast }: Props) => {
  const currentNetwork: any = useRef()
  const [isLoading, setLoading] = useState<any>(true)
  const [unavailable, setUnavailable] = useState<any>(false)
  const [tokensItems, setTokensItems] = useState<any>([])
  const [details, setDetails] = useState<any>([])

  const { t } = useTranslation()

  const onTokenSelect = useCallback(
    async (value) => {
      const token = tokensItems.find(({ address }: any) => address === value)
      if (token) {
        setDetails([
          [t('Annual Percentage Rate (APR)'), `${token.apr}%`],
          [t('Lock'), t('No Lock')],
          [t('Type'), t('Variable Rate')]
        ])
      }
    },
    [tokensItems]
  )

  const networkDetails: any = networks.find(({ id }) => id === networkId)
  const defaultTokens = useMemo(() => getDefaultTokensItems(networkDetails.id), [networkDetails.id])
  const getToken = (type: any, address: any) =>
    tokensItems
      .filter((token: any) => token.type === type)
      .find((token: any) => token.address === address)
  const addRequestTxn = (id: any, txn: any, extraGas = 0) =>
    addRequest({
      id,
      type: 'eth_sendTransaction',
      chainId: networkDetails.chainId,
      account: selectedAcc,
      txn,
      extraGas
    })

  const onValidate = async (type: any, tokenAddress: any, amount: any) => {
    if (type === 'Deposit') {
      const token = getToken('deposit', tokenAddress)
      const bigNumberHexAmount = ethers.utils
        .parseUnits(amount.toString(), token.decimals)
        .toHexString()
      await approveToken(
        'Aave Pool',
        networkDetails.id,
        selectedAcc,
        lendingPoolAddress,
        tokenAddress,
        addRequestTxn,
        addToast
      )

      try {
        addRequestTxn(
          `aave_pool_deposit_${Date.now()}`,
          {
            to: lendingPoolAddress,
            value: '0x0',
            data: AAVELendingPool.encodeFunctionData('deposit', [
              tokenAddress,
              bigNumberHexAmount,
              selectedAcc,
              0
            ])
          },
          60000
        )
      } catch (e: any) {
        console.error(e)
        addToast(t('Aave Withdraw Error: {{message}}', { message: e.message || e }) as string, {
          error: true
        })
      }
    } else if (type === 'Withdraw') {
      const token = getToken('withdraw', tokenAddress)
      const bigNumberHexAmount = ethers.utils
        .parseUnits(amount.toString(), token.decimals)
        .toHexString()
      await approveToken(
        'Aave Pool',
        networkDetails.id,
        selectedAcc,
        lendingPoolAddress,
        tokenAddress,
        addRequestTxn,
        addToast
      )

      try {
        addRequestTxn(
          `aave_pool_withdraw_${Date.now()}`,
          {
            to: lendingPoolAddress,
            value: '0x0',
            data: AAVELendingPool.encodeFunctionData('withdraw', [
              tokenAddress,
              bigNumberHexAmount,
              selectedAcc
            ])
          },
          60000
        )
      } catch (e: any) {
        console.error(e)
        addToast(t('Aave Withdraw Error: {{message}}', { message: e.message || e }) as string, {
          error: true
        })
      }
    }
  }

  const loadPool: any = useCallback(async () => {
    const providerAddress = AAVELendingPoolProviders[networkDetails.id]
    if (!providerAddress) {
      setLoading(false)
      setUnavailable(true)
      return
    }

    try {
      const provider = getProvider(networkDetails.id)
      const lendingPoolProviderContract = new ethers.Contract(
        providerAddress,
        AAVELendingPool,
        provider
      )
      lendingPoolAddress = await lendingPoolProviderContract.getLendingPool()

      const lendingPoolContract = new ethers.Contract(lendingPoolAddress, AAVELendingPool, provider)
      const reserves = await lendingPoolContract.getReservesList()
      const reservesAddresses = reserves.map((reserve: any) => reserve.toLowerCase())
      const supportedATokens = defaultTokens
        .filter((token: any) => token.type === 'withdraw')
        .map((token: any) => token.address.toLowerCase())

      const withdrawTokens = tokens
        .filter(({ address }) => supportedATokens.includes(address.toLowerCase()))
        .map((token) => ({
          ...token,
          address: defaultTokens.find(
            (tk) =>
              tk.type === 'withdraw' && tk.address.toLowerCase() === token.address.toLowerCase()
          )?.baseTokenAddress,
          type: 'withdraw'
        }))
        .filter((token) => token)
        .sort((a, b) => b.balance - a.balance)

      const depositTokens = tokens
        .filter(({ address }: any) => reservesAddresses.includes(address))
        .map((token: any) => ({
          ...token,
          type: 'deposit'
        }))
        .filter((token: any) => token)

      const allTokens = await Promise.all([
        ...withdrawTokens,
        ...depositTokens,
        ...defaultTokens.filter(
          ({ type, address }) =>
            type === 'deposit' &&
            // eslint-disable-next-line @typescript-eslint/no-shadow
            !depositTokens
              .map(({ address }: any) => address.toLowerCase())
              .includes(address.toLowerCase())
        ),
        ...defaultTokens.filter(
          ({ type, baseTokenAddress }) =>
            type === 'withdraw' &&
            // eslint-disable-next-line @typescript-eslint/no-shadow
            !withdrawTokens
              .map(({ address }: any) => address.toLowerCase())
              .includes(baseTokenAddress.toLowerCase())
        )
      ])

      const uniqueTokenAddresses = [...new Set(allTokens.map(({ address }) => address))]
      const tokensAPR = Object.fromEntries(
        await Promise.all(
          uniqueTokenAddresses.map(async (address) => {
            const data = await lendingPoolContract.getReserveData(address)
            const { liquidityRate } = data
            const apr = ((liquidityRate / RAY) * 100).toFixed(2)
            return [address, apr]
          })
        )
      )

      // eslint-disable-next-line @typescript-eslint/no-shadow
      const tokensItems = allTokens.map((token) => {
        const arp =
          tokensAPR[token.address] === '0.00' && tokensAPR[token.baseTokenAddress]
            ? tokensAPR[token.baseTokenAddress]
            : tokensAPR[token.address]
        return {
          ...token,
          apr: arp,
          icon: token.img || token.tokenImageUrl,
          label: `${token.symbol} (${tokensAPR[token.address]}% APR)`,
          value: token.address
        }
      })

      // Prevent race conditions
      if (currentNetwork.current !== networkDetails.id) return

      setTokensItems(tokensItems)
      setLoading(false)
      setUnavailable(false)
    } catch (e: any) {
      console.error(e)
      addToast(t('Aave load pool error: {{message}}', { message: e.message || e }) as string, {
        error: true
      })
    }
  }, [addToast, tokens, defaultTokens, networkDetails])

  useEffect(() => {
    currentNetwork.current = networkId
    setLoading(true)
  }, [networkId])

  useEffect(() => {
    loadPool()
  }, [loadPool])

  return (
    <Card
      name={CARDS.AAVE}
      icon={AAVELogo}
      iconStyle={{ width: 137, height: 38 }}
      loading={isLoading}
      unavailable={unavailable}
      details={details}
      tokensItems={tokensItems}
      onTokenSelect={onTokenSelect}
      onValidate={onValidate}
    />
  )
}

export default React.memo(AAVECard, isEqual)
