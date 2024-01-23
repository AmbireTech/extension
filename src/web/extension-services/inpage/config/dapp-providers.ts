import { NETWORKS } from 'ambire-common/src/constants/networks'

export const DAPP_PROVIDER_URLS: { [key: string]: { [key in NETWORKS]?: string } } = {
  'app.uniswap.org': {
    [NETWORKS.ethereum]: 'https://mainnet.infura.io/v3/099fc58e0de9451d80b18d7c74caa7c1',
    [NETWORKS.polygon]: 'https://polygon-mainnet.infura.io/v3/099fc58e0de9451d80b18d7c74caa7c1',
    [NETWORKS.optimism]: 'https://optimism-mainnet.infura.io/v3/099fc58e0de9451d80b18d7c74caa7c1',
    [NETWORKS.arbitrum]: 'https://arbitrum-mainnet.infura.io/v3/099fc58e0de9451d80b18d7c74caa7c1'
  },
  'app.aave.com': {
    [NETWORKS.ethereum]: 'https://eth-mainnet.gateway.pokt.network/v1/lb/62b3314e123e6f00397f19ca',
    [NETWORKS.arbitrum]: ' https://arb1.arbitrum.io/rpc',
    [NETWORKS.avalanche]:
      'https://avax-mainnet.gateway.pokt.network/v1/lb/62b3314e123e6f00397f19ca/ext/bc/C/rpc',
    [NETWORKS.fantom]: 'https://fantom-mainnet.gateway.pokt.network/v1/lb/62b3314e123e6f00397f19ca',
    [NETWORKS.optimism]:
      'https://optimism-mainnet.gateway.pokt.network/v1/lb/62b3314e123e6f00397f19ca',
    [NETWORKS.polygon]: 'https://poly-mainnet.gateway.pokt.network/v1/lb/62b3314e123e6f00397f19ca'
  },
  'www.myetherwallet.com': {
    [NETWORKS.ethereum]: 'wss://nodes.mewapi.io/ws/eth',
    [NETWORKS.polygon]: 'wss://nodes.mewapi.io/ws/matic',
    [NETWORKS['binance-smart-chain']]: 'wss://nodes.mewapi.io/ws/bsc',
    [NETWORKS.moonbeam]: 'wss://wss.api.moonbeam.network',
    [NETWORKS.moonriver]: 'wss://wss.api.moonriver.moonbeam.network'
  },
  'pancakeswap.finance': {
    [NETWORKS.ethereum]: 'https://eth-mainnet.nodereal.io/v1/13acdadd769d4128b5c4a994e42140b3',
    [NETWORKS['binance-smart-chain']]: 'https://nodes.pancakeswap.info'
  },
  'app.1inch.io': {
    [NETWORKS.ethereum]: 'https://web3-node.1inch.io',
    [NETWORKS.polygon]: 'https://bor-nodes.1inch.io',
    [NETWORKS['binance-smart-chain']]: 'https://bsc-nodes.1inch.io',
    [NETWORKS.optimism]: 'https://optimism-nodes.1inch.io',
    [NETWORKS.arbitrum]: 'https://arbitrum-nodes.1inch.io',
    [NETWORKS.gnosis]: 'https://gnosis-nodes.1inch.io',
    [NETWORKS.avalanche]: 'https://avalanche-nodes.1inch.io',
    [NETWORKS.fantom]: 'https://fantom-nodes.1inch.io'
  },
  'app.gmx.io': {
    [NETWORKS.avalanche]: 'https://api.avax.network/ext/bc/C/rpc',
    [NETWORKS.arbitrum]: 'https://arb1.arbitrum.io/rpc'
  },
  'stargate.finance': {
    [NETWORKS.ethereum]: 'https://eth-mainnet.public.blastapi.io',
    [NETWORKS['binance-smart-chain']]: 'https://bsc-dataseed4.binance.org',
    [NETWORKS.avalanche]: 'https://api.avax.network/ext/bc/C/rpc',
    [NETWORKS.polygon]: 'https://polygon-rpc.com',
    [NETWORKS.arbitrum]: 'https://arb1.arbitrum.io/rpc',
    [NETWORKS.optimism]: 'https://endpoints.omniatech.io/v1/op/mainnet/public',
    [NETWORKS.fantom]: 'https://rpc.ftm.tools'
  },
  'apeswap.finance': {
    [NETWORKS.polygon]: 'https://polygon-rpc.com',
    [NETWORKS['binance-smart-chain']]: 'https://bsc-dataseed1.defibit.io',
    [NETWORKS.ethereum]: 'https://eth-mainnet.nodereal.io/v1/43f9100965104de49b580d1fa1ab28c0'
  },
  'www.bungee.exchange': {
    [NETWORKS.ethereum]: 'https://cloudflare-eth.com',
    [NETWORKS.polygon]: 'https://polygon-rpc.com',
    [NETWORKS.avalanche]: 'https://api.avax.network/ext/bc/C/rpc',
    [NETWORKS['binance-smart-chain']]: 'https://rpc.ankr.com/bsc',
    [NETWORKS.fantom]: 'https://rpc.ankr.com/fantom',
    [NETWORKS.arbitrum]: 'https://arb1.arbitrum.io/rpc',
    [NETWORKS.gnosis]: 'https://rpc.gnosischain.com',
    [NETWORKS.optimism]: 'https://mainnet.optimism.io'
  },
  'traderjoexyz.com': {
    [NETWORKS.avalanche]: 'https://avalanche-mainnet.infura.io/v3/6cdd13dd4a2e477fbee3e414554b86d1',
    [NETWORKS.arbitrum]: 'https://arbitrum-mainnet.infura.io/v3/6cdd13dd4a2e477fbee3e414554b86d1',
    [NETWORKS['binance-smart-chain']]:
      'https://bsc-mainnet.nodereal.io/v1/79d1a2d720f648edac151b01d496cb88'
  },
  'app.sushi.com': {
    [NETWORKS.ethereum]: 'https://eth-mainnet.g.alchemy.com/v2/COpzSDPut2F6jOFtgZOCia5woilJXSlA',
    [NETWORKS.polygon]: 'https://polygon-rpc.com/',
    [NETWORKS.avalanche]: 'https://api.avax.network/ext/bc/C/rpc',
    [NETWORKS['binance-smart-chain']]: 'https://bsc-dataseed.binance.org',
    [NETWORKS.fantom]: 'https://rpcapi.fantom.network',
    [NETWORKS.moonbeam]: 'https://rpc.api.moonbeam.network',
    [NETWORKS.moonriver]: 'https://rpc.moonriver.moonbeam.network',
    [NETWORKS.arbitrum]: 'https://arb1.arbitrum.io/rpc',
    [NETWORKS.gnosis]: 'https://rpc.gnosischain.com',
    [NETWORKS.optimism]: 'https://mainnet.optimism.io',
    [NETWORKS.andromeda]: 'https://andromeda.metis.io/?owner=1088'
  },
  'app.pooltogether.com': {
    [NETWORKS.ethereum]:
      'https://ethereum-mainnet-web3-provider-proxy.pooltogether-api.workers.dev',
    [NETWORKS.polygon]: 'https://polygon-mainnet.infura.io/v3/1d6cb6d8f137423ab26111c61c0760ef',
    [NETWORKS.avalanche]: 'https://api.avax.network/ext/bc/C/rpc',
    [NETWORKS.optimism]: 'https://optimism-mainnet-web3-provider-proxy.pooltogether-api.workers.dev'
  },
  'stake.lido.fi': {
    [NETWORKS.ethereum]: 'https://stake.lido.fi/api/rpc?chainId=1'
  },
  // Note: Returns 500 for `eth_chainId`, `net_version` and other rpc methods
  // 'polygon.lido.fi': {
  //   [NETWORKS.ethereum]: 'https://polygon.lido.fi/api/rpc?chainId=1'
  // }
  'swap.cow.fi': {
    [NETWORKS.ethereum]: 'https://mainnet.infura.io/v3/586e7e6b7c7e437aa41f5da496a749f5',
    [NETWORKS.gnosis]: 'https://rpc.gnosis.gateway.fm'
  },
  'app.hop.exchange': {
    [NETWORKS.ethereum]: 'https://mainnet.infura.io/v3/84842078b09946638c03157f83405213',
    [NETWORKS.polygon]: 'https://polygon-rpc.com',
    [NETWORKS.gnosis]: 'https://rpc.gnosis.gateway.fm',
    [NETWORKS.optimism]: 'https://optimism-mainnet.infura.io/v3/84842078b09946638c03157f83405213',
    [NETWORKS.arbitrum]: 'https://arb1.arbitrum.io/rpc'
  },
  'sudoswap.xyz': {
    [NETWORKS.ethereum]: 'https://eth-mainnet.g.alchemy.com/v2/PJG1MyfrI9qb_JdOJJVSa5stBo5O7uyU'
  },
  'app.paraswap.io': {
    [NETWORKS.ethereum]: 'https://eth.llamarpc.com',
    [NETWORKS.polygon]: 'https://polygon-rpc.com',
    [NETWORKS.avalanche]: 'https://api.avax.network/ext/bc/C/rpc',
    [NETWORKS.arbitrum]: 'https://arb1.arbitrum.io/rpc',
    [NETWORKS.fantom]: 'https://rpcapi.fantom.network',
    [NETWORKS.optimism]: 'https://mainnet.optimism.io',
    [NETWORKS['binance-smart-chain']]: 'https://bsc-dataseed1.defibit.io'
  },
  'app.balancer.fi': {
    [NETWORKS.ethereum]: 'https://mainnet.infura.io/v3/daaa68ec242643719749dd1caba2fc66',
    [NETWORKS.polygon]: 'https://polygon-mainnet.infura.io/v3/daaa68ec242643719749dd1caba2fc66',
    [NETWORKS.arbitrum]: 'https://arb-mainnet.g.alchemy.com/v2/VBeQgTCRqqPtuuEPsFzRdwKXzDyN6aFh',
    [NETWORKS.gnosis]: 'https://poa-xdai.gateway.pokt.network/v1/lb/91bc0e12a76e7a84dd76189d'
  },
  'app.aelin.xyz': {
    [NETWORKS.ethereum]: 'https://eth-mainnet.g.alchemy.com/v2/ZiZqTPedjN8yIQlaaJ5uZXMU7eI9A9ab',
    [NETWORKS.optimism]: 'https://opt-mainnet.g.alchemy.com/v2/nkwspVwpu6Yyst5x9MI5bm4lUysOEUAS',
    [NETWORKS.polygon]: 'https://polygon-mainnet.g.alchemy.com/v2/exQuQ4Bh3aTvZz22vXMG9DOoK6RG8Fgm',
    [NETWORKS.arbitrum]: 'https://arb-mainnet.g.alchemy.com/v2/jm6UWDyOE-KOydCL_jFQwu_7VkAWUXJb'
  }
}
