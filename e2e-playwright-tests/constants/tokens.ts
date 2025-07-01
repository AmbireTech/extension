import Token from '../interfaces/token'

type TokenSymbol = 'dai' | 'usdc' | 'usdce' | 'wallet' | 'eth' | 'link' | 'wcres' | 'xwallet'
type Network = 'optimism' | 'base' | 'ethereum'

type Tokens = Record<TokenSymbol, Partial<Record<Network, Token>>>

const tokens: Tokens = {
  eth: {
    ethereum: {
      address: '0x0000000000000000000000000000000000000000',
      chainId: '1',
      symbol: 'ETH'
    },
    base: {
      address: '0x0000000000000000000000000000000000000000',
      chainId: '8453',
      symbol: 'ETH'
    }
  },
  wcres: {
    ethereum: {
      address: '0xa0afaa285ce85974c3c881256cb7f225e3a1178a',
      chainId: '1',
      symbol: 'wCRES'
    }
  },
  link: {
    base: {
      address: '0x88fb150bdc53a65fe94dea0c9ba0a6daf8c6e196',
      chainId: '8453',
      symbol: 'LINK'
    }
  },
  dai: {
    optimism: {
      address: '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1',
      chainId: '10',
      symbol: 'DAI'
    }
  },
  usdc: {
    optimism: {
      address: '0x0b2c639c533813f4aa9d7837caf62653d097ff85',
      chainId: '10',
      symbol: 'USDC'
    },
    base: {
      address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
      chainId: '8453',
      symbol: 'USDC'
    },
    ethereum: {
      address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      chainId: '1',
      symbol: 'USDC'
    }
  },
  usdce: {
    optimism: {
      address: '0x7f5c764cbc14f9669b88837ca1490cca17c31607',
      chainId: '10',
      symbol: 'USDC.E'
    }
  },
  wallet: {
    base: {
      address: '0x0bbbead62f7647ae8323d2cb243a0db74b7c2b80',
      chainId: '8453',
      symbol: 'WALLET'
    }
  },
  xwallet: {
    ethereum: {
      address: '0x47cd7e91c3cbaaf266369fe8518345fc4fc12935',
      chainId: '1',
      symbol: 'xWALLET'
    }
  }
}

export default tokens
