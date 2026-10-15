import { PIMLICO } from '@ambire-common/consts/bundlers'
import { networks as predefinedNetworks } from '@ambire-common/consts/networks'
import {
  Network,
  RelayerNetwork,
  RelayerNetworkConfigResponse
} from '@ambire-common/interfaces/network'

import { logInfoWithPrefix, logWarnWithPrefix } from '@common/utils/logger'

import { getBuildTimeNetworks } from './helpers'

jest.mock('@common/utils/logger', () => ({
  logInfoWithPrefix: jest.fn(),
  logWarnWithPrefix: jest.fn()
}))

const logInfo = logInfoWithPrefix as jest.Mock
const logWarn = logWarnWithPrefix as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
})

// Verbatim entries of https://relayer.ambire.com/v2/config/networks, so the test
// breaks if the relayer shape drifts away from what the mapper expects.
const BNB_CHAIN: RelayerNetwork = {
  predefinedConfigVersion: 7,
  ambireId: 'binance-smart-chain',
  chainId: 56,
  platformId: 'binance-smart-chain',
  name: 'BNB Chain',
  iconUrls: [
    'https://cena.ambire.com/public/networks/bnb.png',
    'https://cena.ambire.com/public/networks/bnb.svg'
  ],
  explorerUrl: 'https://bscscan.com',
  rpcUrls: ['https://invictus.ambire.com/binance-smart-chain'],
  selectedRpcUrl: 'https://invictus.ambire.com/binance-smart-chain',
  native: {
    symbol: 'BNB',
    name: 'BNB',
    coingeckoId: 'binancecoin',
    decimals: 18,
    wrapped: {
      address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
      symbol: 'WBNB',
      name: 'Wrapped BNB',
      coingeckoId: 'wbnb',
      decimals: 18
    }
  },
  isOptimistic: false,
  disableEstimateGas: true,
  feeOptions: { is1559: true },
  has7702: true,
  smartAccounts: {
    hasRelayer: true,
    erc4337: {
      enabled: false,
      hasPaymaster: true,
      hasBundlerSupport: true,
      bundlers: [PIMLICO],
      defaultBundler: PIMLICO
    }
  },
  refreshInterval: 2000
}

const GNOSIS: RelayerNetwork = {
  predefinedConfigVersion: 7,
  ambireId: 'gnosis',
  chainId: 100,
  platformId: 'xdai',
  name: 'Gnosis',
  iconUrls: ['https://cena.ambire.com/public/networks/gnosis.jpg'],
  explorerUrl: 'https://gnosisscan.io',
  rpcUrls: ['https://invictus.ambire.com/gnosis', 'https://rpc.gnosischain.com'],
  selectedRpcUrl: 'https://invictus.ambire.com/gnosis',
  native: {
    symbol: 'XDAI',
    name: 'XDAI',
    coingeckoId: 'xdai',
    decimals: 18,
    wrapped: {
      address: '0xe91d153e0b41518a2ce8dd3d7944fa863463a97d',
      symbol: 'WXDAI',
      name: 'Wrapped xDAI',
      coingeckoId: 'xdai',
      decimals: 18
    }
  },
  isOptimistic: false,
  disableEstimateGas: true,
  feeOptions: { is1559: false },
  has7702: true,
  disabledByDefault: true
}

const AVALANCHE: RelayerNetwork = {
  ...GNOSIS,
  ambireId: 'avalanche',
  chainId: 43114,
  platformId: 'avalanche',
  name: 'Avalanche',
  iconUrls: ['https://cena.ambire.com/public/networks/avalanche.png'],
  explorerUrl: 'https://snowscan.xyz',
  rpcUrls: ['https://invictus.ambire.com/avalanche'],
  selectedRpcUrl: 'https://invictus.ambire.com/avalanche',
  feeOptions: { is1559: true, minBaseFee: 25000000000 },
  disabledByDefault: undefined
}

const mapOne = (relayerNetwork: RelayerNetwork): Network => {
  const [network] = getBuildTimeNetworks({ [relayerNetwork.chainId.toString()]: relayerNetwork })
  if (!network) throw new Error(`chain ${relayerNetwork.chainId} was dropped while mapping`)

  return network
}

describe('getBuildTimeNetworks', () => {
  it('falls back to the networks predefined in ambire-common when the build could not reach the relayer', () => {
    expect(getBuildTimeNetworks(null)).toBe(predefinedNetworks)
  })

  it('warns which networks are left when it falls back, so the gap is visible in the console', () => {
    getBuildTimeNetworks(null)

    expect(logWarn).toHaveBeenCalledWith(
      'networks',
      expect.stringContaining('could not reach the relayer'),
      predefinedNetworks.map((network) => network.chainId.toString())
    )
    expect(logInfo).not.toHaveBeenCalled()
  })

  it('logs how many networks the build shipped with and which chains they are', () => {
    getBuildTimeNetworks({ '56': BNB_CHAIN, '100': GNOSIS })

    expect(logInfo).toHaveBeenCalledWith('networks', expect.stringContaining('2 networks'), [
      '56 BNB Chain',
      '100 Gnosis'
    ])
    expect(logWarn).not.toHaveBeenCalled()
  })

  it('returns an empty list for an empty relayer config, instead of falling back', () => {
    expect(getBuildTimeNetworks({})).toEqual([])
  })

  it('maps every network in the relayer config, keeping its order', () => {
    const config: RelayerNetworkConfigResponse = {
      '56': BNB_CHAIN,
      '100': GNOSIS,
      '43114': AVALANCHE
    }

    const networks = getBuildTimeNetworks(config)

    expect(networks.map((network) => network.name)).toEqual(['BNB Chain', 'Gnosis', 'Avalanche'])
    expect(networks.map((network) => network.chainId)).toEqual([56n, 100n, 43114n])
  })

  it('maps the fields benzin renders, and turns the chain id into a bigint', () => {
    const bnbChain = mapOne(BNB_CHAIN)

    expect(bnbChain.chainId).toBe(56n)
    expect(bnbChain.name).toBe('BNB Chain')
    expect(bnbChain.iconUrls).toEqual(BNB_CHAIN.iconUrls)
    expect(bnbChain.explorerUrl).toBe('https://bscscan.com')
    expect(bnbChain.rpcUrls).toEqual(['https://invictus.ambire.com/binance-smart-chain'])
    expect(bnbChain.selectedRpcUrl).toBe('https://invictus.ambire.com/binance-smart-chain')
    expect(bnbChain.nativeAssetSymbol).toBe('BNB')
    expect(bnbChain.nativeAssetName).toBe('BNB')
    expect(bnbChain.wrappedAddr).toBe('0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c')
    expect(bnbChain.refreshInterval).toBe(2000)
  })

  it('maps the smart account settings benzin needs to resolve a user operation', () => {
    const bnbChain = mapOne(BNB_CHAIN)

    expect(bnbChain.hasRelayer).toBe(true)
    expect(bnbChain.isSAEnabled).toBe(true)
    expect(bnbChain.has7702).toBe(true)
    expect(bnbChain.erc4337).toEqual({
      enabled: false,
      hasPaymaster: true,
      hasBundlerSupport: true,
      bundlers: [PIMLICO],
      defaultBundler: PIMLICO
    })
  })

  it('converts the numeric fee options into bigints', () => {
    const avalanche = mapOne(AVALANCHE)

    expect(avalanche.feeOptions).toEqual({
      is1559: true,
      minBaseFee: 25000000000n,
      minBaseFeeEqualToLastBlock: false
    })
  })

  it('marks a network the extension hides by default as not predefined', () => {
    expect(mapOne(GNOSIS).predefined).toBe(false)
    expect(mapOne(BNB_CHAIN).predefined).toBe(true)
  })

  it('covers the chains that are missing from the networks predefined in ambire-common', () => {
    const networks = getBuildTimeNetworks({ '56': BNB_CHAIN, '100': GNOSIS, '43114': AVALANCHE })
    const predefinedChainIds = predefinedNetworks.map((network) => network.chainId)

    expect(predefinedChainIds).not.toContain(100n)
    expect(networks.map((network) => network.chainId)).toContain(100n)
  })
})
