import networks, { NetworkId, NETWORKS, NetworkType } from 'ambire-common/src/constants/networks'
import { initUnstoppableDomainsResolution } from 'ambire-common/src/services/unstoppableDomains'
import { providers } from 'ethers'

import CustomJsonRpcProvider from '@common/services/CustomJsonRpcProvider'

// TODO: move these in .env
// currently here to avoid publishing a new build for the mobile apps and avoid the stores review process
const RPC_URL_ETHEREUM = 'https://invictus.ambire.com/ethereum'
// Ambire Earn uses a separate RPC provider
const RPC_URL_ETHEREUM_AMBIRE_EARN =
  'https://unufri-ethereum.adex.network/v3/099fc58e0de9451d80b18d7c74caa7c1'
const RPC_URL_POLYGON = 'https://invictus.ambire.com/polygon'
const RPC_URL_AVALANCHE = 'https://invictus.ambire.com/avalanche'
const RPC_URL_BNB_CHAIN = 'https://invictus.ambire.com/binance-smart-chain'
const RPC_URL_FANTOM = 'https://invictus.ambire.com/fantom'
const RPC_URL_MOONBEAM = 'https://invictus.ambire.com/moonbeam'
const RPC_URL_MOONRIVER = 'https://invictus.ambire.com/moonriver'
const RPC_URL_ARBITRUM = 'https://invictus.ambire.com/arbitrum'
const RPC_URL_GNOSIS = 'https://invictus.ambire.com/gnosis'
const RPC_URL_KUCOIN = 'https://invictus.ambire.com/kucoin'
const RPC_URL_OPTIMISM = 'https://invictus.ambire.com/optimism'
const RPC_URL_ANDROMEDA = 'https://invictus.ambire.com/andromeda'
const RPC_URL_BASE = 'https://invictus.ambire.com/base'
const RPC_URL_CRONOS = 'https://evm-cronos.crypto.org'
const RPC_URL_AURORA = 'https://mainnet.aurora.dev'
const RPC_URL_OKC = 'https://exchainrpc.okex.org'
const RPC_URL_ETHEREUM_POW = 'https://mainnet.ethereumpow.org'
const RPC_URL_MUMBAI = 'https://invictus.ambire.com/mumbai'
const RPC_URL_SEPOLIA = 'https://invictus.ambire.com/sepolia'

const RPC_URLS: {
  [key in NETWORKS]: string
} = {
  [NETWORKS.ethereum]: RPC_URL_ETHEREUM,
  [NETWORKS.polygon]: RPC_URL_POLYGON,
  [NETWORKS.avalanche]: RPC_URL_AVALANCHE,
  [NETWORKS['binance-smart-chain']]: RPC_URL_BNB_CHAIN,
  [NETWORKS.fantom]: RPC_URL_FANTOM,
  [NETWORKS.moonbeam]: RPC_URL_MOONBEAM,
  [NETWORKS.moonriver]: RPC_URL_MOONRIVER,
  [NETWORKS.arbitrum]: RPC_URL_ARBITRUM,
  [NETWORKS.gnosis]: RPC_URL_GNOSIS,
  [NETWORKS.kucoin]: RPC_URL_KUCOIN,
  [NETWORKS.optimism]: RPC_URL_OPTIMISM,
  [NETWORKS.base]: RPC_URL_BASE,
  [NETWORKS.andromeda]: RPC_URL_ANDROMEDA,
  [NETWORKS.cronos]: RPC_URL_CRONOS,
  [NETWORKS.aurora]: RPC_URL_AURORA,
  [NETWORKS.okc]: RPC_URL_OKC,
  [NETWORKS['ethereum-pow']]: RPC_URL_ETHEREUM_POW,
  [NETWORKS.mumbai]: RPC_URL_MUMBAI,
  [NETWORKS.sepolia]: RPC_URL_SEPOLIA
}

// @ts-ignore
const rpcProviders: { [key in NetworkId]: any } = {}

const setProvider = (_id: NetworkId) => {
  // eslint-disable-next-line no-underscore-dangle
  const url = RPC_URLS[_id]
  const network = networks.find(({ id }) => id === _id)
  if (!network) return null

  const { id: name, chainId, ensName } = network as NetworkType

  if (url && url?.startsWith('wss:')) {
    return new providers.WebSocketProvider(url, {
      name: ensName || name,
      chainId
    })
  }
  // origin needed for the ankr rpc
  return new CustomJsonRpcProvider(
    { url, origin: 'https://wallet.ambire.com' },
    {
      name: ensName || name,
      chainId
    }
  )
}

if (!Object.keys(rpcProviders).length) {
  ;(Object.keys(NETWORKS) as Array<keyof typeof NETWORKS>).forEach((networkId: NetworkId) => {
    rpcProviders[networkId] = setProvider(networkId)
  })

  // Ambire Earn uses a separate RPC provider that gets initiated separately.
  // @ts-ignore
  rpcProviders['ethereum-ambire-earn'] = new providers.StaticJsonRpcProvider(
    RPC_URL_ETHEREUM_AMBIRE_EARN,
    {
      name: 'ethereum-ambire-earn',
      chainId: 1
    }
  )

  // Initiate Unstoppable domains resolution with the Ambire RPC providers,
  // since it does not resolve all domains with it's default ones.
  initUnstoppableDomainsResolution(RPC_URLS)
}

export { rpcProviders }
