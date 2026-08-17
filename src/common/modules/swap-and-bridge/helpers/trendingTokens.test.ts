import { TrendingToken } from '@ambire-common/interfaces/dapp'
import { SupportedNetworks } from '@ambire-common/interfaces/network'

import { getTrendingTokensForChain } from './trendingTokens'

const buildTrendingToken = (overrides: Partial<TrendingToken> = {}): TrendingToken => ({
  id: 'some-token',
  name: 'Some Token',
  symbol: 'SMT',
  icon: 'https://example.com/icon.png',
  priceUSD: 1.5,
  priceChange24hUSD: 2.3,
  marketCapRank: 10,
  description: null,
  address: '0xaaa',
  platformId: 'ethereum',
  decimals: 18,
  marketCapUSD: null,
  totalVolumeUSD: null,
  fullyDilutedValuationUSD: null,
  totalSupply: null,
  website: null,
  exchangeIds: [],
  ...overrides
})

const buildNetwork = (overrides: Partial<SupportedNetworks> = {}) =>
  ({
    chainId: 1n,
    platformId: 'ethereum',
    ...overrides
  }) as SupportedNetworks

describe('getTrendingTokensForChain', () => {
  it('returns an empty list when no chain is selected', () => {
    expect(getTrendingTokensForChain([buildTrendingToken()], null, [buildNetwork()])).toEqual([])
  })

  it('returns an empty list when the selected chain is not found among the networks', () => {
    expect(getTrendingTokensForChain([buildTrendingToken()], 999, [buildNetwork()])).toEqual([])
  })

  it('filters out tokens whose platform does not match the selected chain', () => {
    const tokens = [
      buildTrendingToken({ platformId: 'ethereum' }),
      buildTrendingToken({ id: 'other', platformId: 'optimistic-ethereum' })
    ]

    const result = getTrendingTokensForChain(tokens, 1, [buildNetwork()])

    expect(result).toHaveLength(1)
    expect(result[0]!.address).toBe('0xaaa')
  })

  it('drops tokens without a resolved contract address or decimals', () => {
    const tokens = [
      buildTrendingToken({ address: null }),
      buildTrendingToken({ id: 'no-decimals', decimals: null })
    ]

    expect(getTrendingTokensForChain(tokens, 1, [buildNetwork()])).toEqual([])
  })

  it('maps a matching trending token to the Swap & Bridge token shape', () => {
    const result = getTrendingTokensForChain(
      [buildTrendingToken({ priceUSD: 42.5 })],
      1,
      [buildNetwork()]
    )

    expect(result).toEqual([
      {
        symbol: 'SMT',
        name: 'Some Token',
        chainId: 1,
        address: '0xaaa',
        icon: 'https://example.com/icon.png',
        decimals: 18,
        priceUSD: '42.5'
      }
    ])
  })
})
