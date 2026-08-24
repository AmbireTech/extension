import { networks } from '@ambire-common/consts/networks'
import { CustomToken, TokenPreference } from '@ambire-common/libs/portfolio/customToken'
import { CollectionResult, TokenResult } from '@ambire-common/libs/portfolio/interfaces'

import { ALL_NETWORKS_FILTER, composeAssetLists } from './composeAssetLists'

const ETHEREUM = 1n
const OPTIMISM = 10n

const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const WALLET = '0x88800092fF476844f74dC2FC427974BBee2794Ae'
const BAYC = '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D'
const AZUKI = '0xED5AF388653567Af2F388E6224dC7C4b3241C544'

const getToken = (
  address: string,
  chainId: bigint,
  overrides: Partial<TokenResult> = {}
): TokenResult => ({
  address,
  chainId,
  symbol: 'TOKEN',
  name: 'Token',
  decimals: 18,
  amount: 1n,
  priceIn: [],
  marketDataIn: [],
  ...overrides,
  flags: {
    onGasTank: false,
    rewardsType: null,
    canTopUpGasTank: false,
    isFeeToken: false,
    ...overrides.flags
  }
})

const getCollection = (
  address: string,
  chainId: bigint,
  overrides: Partial<CollectionResult> = {}
): CollectionResult => ({
  ...getToken(address, chainId, overrides),
  name: 'Collection',
  collectibles: [1n],
  ...overrides
})

const compose = (params: {
  standard: CustomToken['standard']
  customTokens?: CustomToken[]
  tokenPreferences?: TokenPreference[]
  portfolioTokens?: TokenResult[]
  portfolioCollections?: CollectionResult[]
  networkFilter?: string
  search?: string
}) =>
  composeAssetLists({
    customTokens: [],
    tokenPreferences: [],
    portfolioTokens: [],
    portfolioCollections: [],
    networks,
    networkFilter: ALL_NETWORKS_FILTER,
    search: '',
    ...params
  })

describe('composeAssetLists', () => {
  describe('selecting by standard', () => {
    it('keeps only the custom assets of the requested standard', () => {
      const customTokens: CustomToken[] = [
        { address: USDC, chainId: ETHEREUM, standard: 'ERC20' },
        { address: BAYC, chainId: ETHEREUM, standard: 'ERC721' }
      ]

      const tokens = compose({ standard: 'ERC20', customTokens })
      const collections = compose({ standard: 'ERC721', customTokens })

      expect(tokens.customAssets.map((a) => a.address)).toEqual([USDC])
      expect(collections.customAssets.map((a) => a.address)).toEqual([BAYC])
    })

    it('keeps only the hidden preferences of the requested standard', () => {
      const tokenPreferences: TokenPreference[] = [
        { address: USDC, chainId: ETHEREUM, isHidden: true, standard: 'ERC20' },
        { address: BAYC, chainId: ETHEREUM, isHidden: true, standard: 'ERC721' }
      ]

      expect(compose({ standard: 'ERC20', tokenPreferences }).hiddenAssets).toHaveLength(1)
      expect(compose({ standard: 'ERC721', tokenPreferences }).hiddenAssets[0]?.address).toBe(BAYC)
    })

    it('ignores preferences that are not hidden', () => {
      const tokenPreferences: TokenPreference[] = [
        { address: USDC, chainId: ETHEREUM, isHidden: false, standard: 'ERC20' }
      ]

      expect(compose({ standard: 'ERC20', tokenPreferences }).hiddenAssets).toEqual([])
    })
  })

  describe('preferences stored without a standard', () => {
    const legacyPreference: TokenPreference[] = [
      { address: BAYC, chainId: ETHEREUM, isHidden: true }
    ]

    it('is a collection when the portfolio knows the address as one', () => {
      const portfolioCollections = [getCollection(BAYC, ETHEREUM)]

      expect(
        compose({ standard: 'ERC721', tokenPreferences: legacyPreference, portfolioCollections })
          .hiddenAssets
      ).toHaveLength(1)
      expect(
        compose({ standard: 'ERC20', tokenPreferences: legacyPreference, portfolioCollections })
          .hiddenAssets
      ).toEqual([])
    })

    it('is a token when the portfolio knows nothing about the address', () => {
      expect(
        compose({ standard: 'ERC20', tokenPreferences: legacyPreference }).hiddenAssets
      ).toHaveLength(1)
      expect(
        compose({ standard: 'ERC721', tokenPreferences: legacyPreference }).hiddenAssets
      ).toEqual([])
    })
  })

  describe('hidden custom assets', () => {
    it('is listed as hidden only, so it is not in both lists', () => {
      const { customAssets, hiddenAssets } = compose({
        standard: 'ERC721',
        customTokens: [{ address: BAYC, chainId: ETHEREUM, standard: 'ERC721' }],
        tokenPreferences: [{ address: BAYC, chainId: ETHEREUM, isHidden: true, standard: 'ERC721' }]
      })

      expect(customAssets).toEqual([])
      expect(hiddenAssets.map((a) => a.address)).toEqual([BAYC])
    })
  })

  describe('assets the portfolio has no entry for', () => {
    it('is listed with a placeholder, so it can still be removed', () => {
      const { customAssets } = compose({
        standard: 'ERC721',
        customTokens: [{ address: BAYC, chainId: ETHEREUM, standard: 'ERC721' }]
      })

      expect(customAssets).toHaveLength(1)
      expect(customAssets[0]?.name).toBe('')
      expect(customAssets[0]?.amount).toBe(0n)
    })

    // A hidden asset was displayed with a "Custom" badge because of this
    it('is only flagged as custom when it is in the custom list', () => {
      const { customAssets } = compose({
        standard: 'ERC20',
        customTokens: [{ address: USDC, chainId: ETHEREUM, standard: 'ERC20' }]
      })
      const { hiddenAssets } = compose({
        standard: 'ERC20',
        tokenPreferences: [
          { address: WALLET, chainId: ETHEREUM, isHidden: true, standard: 'ERC20' }
        ]
      })

      expect(customAssets[0]?.flags.isCustom).toBe(true)
      expect(hiddenAssets[0]?.flags.isCustom).toBe(false)
    })

    it('is enriched with the portfolio data when there is any', () => {
      const { customAssets } = compose({
        standard: 'ERC20',
        customTokens: [{ address: USDC, chainId: ETHEREUM, standard: 'ERC20' }],
        portfolioTokens: [getToken(USDC, ETHEREUM, { symbol: 'USDC', amount: 42n })]
      })

      expect(customAssets[0]?.symbol).toBe('USDC')
      expect(customAssets[0]?.amount).toBe(42n)
    })
  })

  describe('address normalization', () => {
    it('matches a preference to the portfolio regardless of the casing', () => {
      const { hiddenAssets } = compose({
        standard: 'ERC20',
        tokenPreferences: [
          { address: USDC.toLowerCase(), chainId: ETHEREUM, isHidden: true, standard: 'ERC20' }
        ],
        portfolioTokens: [getToken(USDC, ETHEREUM, { symbol: 'USDC' })]
      })

      expect(hiddenAssets[0]?.symbol).toBe('USDC')
    })

    it('matches a hidden custom asset regardless of the casing', () => {
      const { customAssets, hiddenAssets } = compose({
        standard: 'ERC20',
        customTokens: [{ address: USDC, chainId: ETHEREUM, standard: 'ERC20' }],
        tokenPreferences: [
          { address: USDC.toLowerCase(), chainId: ETHEREUM, isHidden: true, standard: 'ERC20' }
        ]
      })

      expect(customAssets).toEqual([])
      expect(hiddenAssets).toHaveLength(1)
    })

    it('treats the same address on another network as a different asset', () => {
      const { hiddenAssets } = compose({
        standard: 'ERC20',
        tokenPreferences: [
          { address: USDC, chainId: ETHEREUM, isHidden: true, standard: 'ERC20' },
          { address: USDC, chainId: OPTIMISM, isHidden: true, standard: 'ERC20' }
        ]
      })

      expect(hiddenAssets).toHaveLength(2)
    })
  })

  describe('gas tank and rewards tokens', () => {
    it('are not used as the portfolio entry of a token', () => {
      const { hiddenAssets } = compose({
        standard: 'ERC20',
        tokenPreferences: [
          { address: WALLET, chainId: ETHEREUM, isHidden: true, standard: 'ERC20' }
        ],
        portfolioTokens: [
          getToken(WALLET, ETHEREUM, { symbol: 'GAS TANK', flags: { onGasTank: true } as any }),
          getToken(WALLET, ETHEREUM, {
            symbol: 'REWARDS',
            flags: { rewardsType: 'wallet-rewards' } as any
          })
        ]
      })

      // Neither duplicate is displayed, so the row falls back to a placeholder
      expect(hiddenAssets).toHaveLength(1)
      expect(hiddenAssets[0]?.symbol).toBe('')
    })
  })

  describe('the network filter', () => {
    it('keeps only the assets of the selected network', () => {
      const tokenPreferences: TokenPreference[] = [
        { address: USDC, chainId: ETHEREUM, isHidden: true, standard: 'ERC20' },
        { address: USDC, chainId: OPTIMISM, isHidden: true, standard: 'ERC20' }
      ]

      const { hiddenAssets } = compose({
        standard: 'ERC20',
        tokenPreferences,
        networkFilter: 'Ethereum'
      })

      expect(hiddenAssets).toHaveLength(1)
      expect(hiddenAssets[0]?.chainId).toBe(ETHEREUM)
    })

    it('keeps every network when no network is selected', () => {
      const tokenPreferences: TokenPreference[] = [
        { address: USDC, chainId: ETHEREUM, isHidden: true, standard: 'ERC20' },
        { address: USDC, chainId: OPTIMISM, isHidden: true, standard: 'ERC20' }
      ]

      expect(compose({ standard: 'ERC20', tokenPreferences }).hiddenAssets).toHaveLength(2)
    })
  })

  describe('search', () => {
    it('matches a token by its symbol', () => {
      const params = {
        standard: 'ERC20' as const,
        tokenPreferences: [
          { address: USDC, chainId: ETHEREUM, isHidden: true, standard: 'ERC20' as const },
          { address: WALLET, chainId: ETHEREUM, isHidden: true, standard: 'ERC20' as const }
        ],
        portfolioTokens: [
          getToken(USDC, ETHEREUM, { symbol: 'USDC' }),
          getToken(WALLET, ETHEREUM, { symbol: 'WALLET' })
        ]
      }

      const { hiddenAssets } = compose({ ...params, search: 'USDC' })

      expect(hiddenAssets.map((a) => a.symbol)).toEqual(['USDC'])
    })

    it('matches a collection by its name', () => {
      const params = {
        standard: 'ERC721' as const,
        tokenPreferences: [
          { address: BAYC, chainId: ETHEREUM, isHidden: true, standard: 'ERC721' as const },
          { address: AZUKI, chainId: ETHEREUM, isHidden: true, standard: 'ERC721' as const }
        ],
        portfolioCollections: [
          getCollection(BAYC, ETHEREUM, { name: 'BoredApeYachtClub' }),
          getCollection(AZUKI, ETHEREUM, { name: 'Azuki' })
        ]
      }

      const { hiddenAssets } = compose({ ...params, search: 'Azuki' })

      expect(hiddenAssets.map((a) => a.name)).toEqual(['Azuki'])
    })

    it('matches by address', () => {
      const { hiddenAssets } = compose({
        standard: 'ERC20',
        tokenPreferences: [
          { address: USDC, chainId: ETHEREUM, isHidden: true, standard: 'ERC20' },
          { address: WALLET, chainId: ETHEREUM, isHidden: true, standard: 'ERC20' }
        ],
        search: USDC
      })

      expect(hiddenAssets.map((a) => a.address)).toEqual([USDC])
    })
  })

  describe('sorting', () => {
    it('orders the assets by network', () => {
      const tokenPreferences: TokenPreference[] = [
        { address: USDC, chainId: OPTIMISM, isHidden: true, standard: 'ERC20' },
        { address: USDC, chainId: ETHEREUM, isHidden: true, standard: 'ERC20' }
      ]

      const { hiddenAssets } = compose({ standard: 'ERC20', tokenPreferences })

      expect(hiddenAssets.map((a) => a.chainId)).toEqual([ETHEREUM, OPTIMISM])
    })
  })
})
