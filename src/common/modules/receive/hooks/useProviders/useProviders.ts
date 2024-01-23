import { NetworkId } from 'ambire-common/src/constants/networks'
import { FC, useState } from 'react'
import url from 'url'

import KriptomatLogo from '@common/assets/svg/KriptomatLogo'
import PayTrieLogo from '@common/assets/svg/PayTrieLogo'
import RampLogo from '@common/assets/svg/RampLogo'
import TransakLogo from '@common/assets/svg/TransakLogo'
import CONFIG from '@common/config/env'
import useNavigation from '@common/hooks/useNavigation'
import useToast from '@common/hooks/useToast'
import { ROUTES } from '@common/modules/router/constants/common'
import { fetchGet } from '@common/services/fetch'

type UseProvidersProps = {
  walletAddress: string
  networkId: NetworkId
}

type UseProvidersReturnType = {
  providers: {
    Icon: FC<any>
    name: string
    type: string
    fees: string
    limits: string
    currencies: string
    networks: string[]
    onClick: () => void
  }[]
  isLoading: any[]
}

const { RAMP_HOST_API_KEY, PAYTRIE_PARTNER_URL, TRANSAK_API_KEY, TRANSAK_ENV, RELAYER_URL } = CONFIG

const relayerURL = RELAYER_URL

const useProviders = ({ walletAddress, networkId }: UseProvidersProps): UseProvidersReturnType => {
  const { navigate } = useNavigation()
  const { addToast } = useToast()
  const [isLoading, setLoading] = useState<any[]>([])

  const openRampNetwork = (name: string) => {
    const assetsList: { [key in NetworkId]?: string } = {
      ethereum: 'ERC20_*,ETH_*',
      polygon: 'MATIC_ERC20_*,MATIC_*',
      avalanche: 'AVAX_*',
      'binance-smart-chain': 'BSC_*,BSC_ERC20_*',
      gnosis: 'XDAI_*'
    }

    navigate(ROUTES.provider, {
      state: {
        name,
        uri: `https://app.ramp.network/?userAddress=${walletAddress}&hostApiKey=${RAMP_HOST_API_KEY}&swapAsset=${assetsList[networkId]}&hostAppName=Ambire&hostLogoUrl=https://www.ambire.com/ambire-logo.png`
      }
    })
  }

  const openPayTrie = (name: string) => {
    const rightSideLabels: { [key in NetworkId]?: string } = {
      ethereum: 'USDC',
      polygon: 'USDC-P',
      'binance-smart-chain': 'USDT-B'
    }

    const URL = url.parse(PAYTRIE_PARTNER_URL, true)
    URL.search = null
    URL.query = {
      ...URL.query,
      addr: walletAddress,
      rightSideLabel: rightSideLabels[networkId]
    }

    navigate(ROUTES.provider, {
      state: {
        name,
        uri: url.format(URL)
      }
    })
  }

  const openTransak = (name: string) => {
    const baseURL =
      TRANSAK_ENV === 'PRODUCTION'
        ? 'https://global.transak.com?'
        : 'https://staging-global.transak.com'

    const networksAlias: { [key in NetworkId]?: string } = {
      avalanche: 'avaxcchain',
      'binance-smart-chain': 'bsc',
      moonbeam: 'mainnet'
    }

    const defaultCurrency: { [key in NetworkId]?: string } = {
      polygon: 'USDC',
      arbitrum: 'ETH',
      avalanche: 'AVAX',
      'binance-smart-chain': 'BNB',
      moonriver: 'MOVR',
      moonbeam: 'GLMR',
      optimism: 'USDC'
    }

    navigate(ROUTES.provider, {
      state: {
        name,
        uri: `${baseURL}?apiKey=${TRANSAK_API_KEY}&themeColor=282b33&disableWalletAddressForm=true&networks=${
          networksAlias[networkId] || networkId
        }&defaultCryptoCurrency=${defaultCurrency[networkId]}&walletAddress=${walletAddress}`
      }
    })
  }

  const openKriptomat = async (name: string) => {
    setLoading((prevState) => ['Kriptomat', ...prevState])
    const kriptomatResponse = await fetchGet(
      `${relayerURL}/kriptomat/${walletAddress}/${networkId}`
    )
    if (kriptomatResponse.success && kriptomatResponse?.data?.url) {
      navigate(ROUTES.provider, {
        state: {
          name,
          uri: url.format(kriptomatResponse.data.url)
        }
      })
    } else {
      addToast(`Error: ${kriptomatResponse.data ? kriptomatResponse.data : 'unexpected error'}`, {
        error: true
      })
    }
    setLoading((prevState) => prevState.filter((n) => n !== 'Kriptomat'))
  }

  const providers = [
    // Hidden since v3.11.0, so it's consistent with the web app
    // {
    //   Icon: KriptomatLogo,
    //   name: 'Kriptomat',
    //   type: 'Credit Card',
    //   fees: '2.45%',
    //   limits: 'up to 5000 EUR/day',
    //   currencies: 'USD, EUR, GBP',
    //   networks: ['ethereum', 'polygon', 'avalanche', 'binance-smart-chain'],
    //   onClick: () => openKriptomat('Kriptomat')
    // },
    {
      Icon: RampLogo,
      name: 'Ramp',
      type: 'Bank Transfer, Credit/Debit Card, Apple Pay',
      fees: '0.49%-2.9%',
      limits: '10,000EUR/m',
      currencies: 'USD, EUR, GBP',
      networks: ['ethereum', 'polygon', 'avalanche', 'binance-smart-chain', 'gnosis'],
      onClick: () => openRampNetwork('Ramp')
    },
    {
      Icon: PayTrieLogo,
      name: 'PayTrie',
      type: 'Bank Transfer',
      fees: '1% (min. $2 CAD)',
      limits: '$2,000CAD/day',
      currencies: 'CAD',
      networks: ['ethereum', 'polygon', 'binance-smart-chain'],
      onClick: () => openPayTrie('PayTrie')
    }
    // Hidden since v3.11.0, so it's consistent with the web app
    // {
    //   Icon: TransakLogo,
    //   name: 'Transak',
    //   type: 'Credit/Debit card & Bank Transfer (depends on location)',
    //   fees: 'from 0.5%',
    //   limits: 'up to 15,000 EUR/day',
    //   currencies: 'GBP, EUR, USD and many more',
    //   networks: [
    //     'ethereum',
    //     'polygon',
    //     'avalanche',
    //     'arbitrum',
    //     'binance-smart-chain',
    //     'moonriver',
    //     'moonbeam',
    //     'optimism'
    //   ],
    //   onClick: () => openTransak('Transak')
    // }
  ]

  return {
    providers,
    isLoading
  }
}

export default useProviders
