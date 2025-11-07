type Network = 'FLR' | 'FLOW'

type NetworkCredentials = {
  networkName: string
  ccySymbol: string
  ccyName: string
  rpcUrl: string
  explorerUrl: string
}

type Networks = Record<Network, NetworkCredentials>

export const networks: Networks = {
  FLR: {
    networkName: 'Flare network',
    ccySymbol: 'FLR',
    ccyName: 'Flare',
    rpcUrl: 'https://rpc.au.cc/flare',
    explorerUrl: 'https://flarescan.com'
  },
  FLOW: {
    networkName: 'Flow EVM Mainnet',
    ccySymbol: 'FLOW',
    ccyName: 'FLOW',
    rpcUrl: 'https://mainnet.evm.nodes.onflow.org',
    explorerUrl: 'https://evm.flowscan.io'
  }
}
