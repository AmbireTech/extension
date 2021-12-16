export type NetworkType = {
  id: string
  chainId: number
  rpc: string
  nativeAssetSymbol: string
  name: string
  icon: string
  explorerUrl: string
}

const networks: NetworkType[] = [
  {
    id: 'ethereum',
    chainId: 1,
    rpc: 'https://mainnet.infura.io/v3/3d22938fd7dd41b7af4197752f83e8a1',
    nativeAssetSymbol: 'ETH',
    name: 'Ethereum',
    icon: '/resources/networks/ethereum.png',
    explorerUrl: 'https://etherscan.io',
  },
  {
    id: 'polygon',
    chainId: 137,
    rpc: 'https://polygon-rpc.com/rpc',
    nativeAssetSymbol: 'MATIC',
    name: 'Polygon',
    icon: '/resources/networks/polygon.png',
    explorerUrl: 'https://polygonscan.com',
  },
  {
    id: 'avalanche',
    chainId: 43114,
    rpc: 'https://api.avax.network/ext/bc/C/rpc',
    nativeAssetSymbol: 'AVAX',
    name: 'Avalanche',
    icon: '/resources/networks/avalanche.png',
    explorerUrl: 'https://snowtrace.io',
  },
  {
    // to match the zapper ID
    id: 'binance-smart-chain',
    chainId: 56,
    rpc: 'https://bsc-dataseed.binance.org/',
    nativeAssetSymbol: 'BNB',
    name: 'Binance Smart Chain',
    icon: '/resources/networks/bsc.png',
    explorerUrl: 'https://bscscan.com',
  } /* , {
  id: 'arbitrum',
  chainId: 42161,
  rpc: 'https://arb1.arbitrum.io/rpc',
  nativeAssetSymbol: 'AETH',
  name: 'Arbitrum',
  icon: '/resources/networks/arbitrum.svg',
  explorerUrl: 'https://arbiscan.io'
} */,
]

export default networks
