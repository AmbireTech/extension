export const GAS_TANK_TOP_UP_AMOUNT = '0.000001'
export const CONFETTI_MODAL_WAIT_TIME = 5000

export const MOCK_RESPONSE = {
  success: true,
  data: {
    rewards: {
      supplyControllerAddr: '0xA69B8074CE03A33B13057B1e9D37DCDE0024Aaff',
      claimableRewardsData: {
        addr: '0x4C71d299f23eFC660b3295D1f631724693aE22Ac',
        fromBalanceClaimable: 0,
        fromADXClaimable: 0,
        totalClaimable: '0'
      },
      xWalletClaimableBalance: {
        address: '0x47Cd7E91C3CBaAF266369fe8518345fc4FC12935',
        symbol: 'XWALLET',
        amount: '0',
        decimals: 18,
        networkId: 'ethereum',
        chainId: 1,
        priceIn: [
          {
            baseCurrency: 'usd',
            price: 0.25107801839139665
          }
        ]
      }
    },
    gasTank: {
      balance: [
        {
          address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          symbol: 'USDC',
          amount: '3523949',
          availableAmount: '3523949',
          cashback: '0',
          saved: '0',
          decimals: 6,
          networkId: 'ethereum',
          chainId: 1,
          priceIn: [
            {
              baseCurrency: 'usd',
              price: 1
            }
          ]
        }
      ],
      availableGasTankAssets: [
        {
          address: '0x0000000000000000000000000000000000000000',
          symbol: 'eth',
          network: 'ethereum',
          chainId: 1,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
          price: 3066.11
        },
        {
          address: '0x0000000000000000000000000000000000000000',
          symbol: 'pol',
          network: 'polygon',
          chainId: 137,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png',
          price: 0.399891
        },
        {
          address: '0x0000000000000000000000000000000000000000',
          symbol: 'ftm',
          network: 'fantom',
          chainId: 250,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/4001/large/Fantom.png',
          price: 0.479516
        },
        {
          address: '0x0000000000000000000000000000000000000000',
          symbol: 'bnb',
          network: 'binance-smart-chain',
          chainId: 56,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
          price: 647.82
        },
        {
          address: '0x0000000000000000000000000000000000000000',
          symbol: 'avax',
          network: 'avalanche',
          chainId: 43114,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/12559/large/coin-round-red.png',
          price: 33.61
        },
        {
          address: '0x0000000000000000000000000000000000000000',
          symbol: 'aeth',
          network: 'arbitrum',
          chainId: 42161,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
          price: 3066.11
        },
        {
          address: '0x0000000000000000000000000000000000000000',
          symbol: 'metis',
          network: 'andromeda',
          chainId: 1088,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/15595/large/metis.PNG',
          price: 31.54
        },
        {
          address: '0x0000000000000000000000000000000000000000',
          symbol: 'eth',
          network: 'base',
          chainId: 8453,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
          price: 3066.11
        },
        {
          address: '0x0000000000000000000000000000000000000000',
          symbol: 'glmr',
          network: 'moonbeam',
          chainId: 1284,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/22459/large/glmr.png',
          price: 0.157777
        },
        {
          address: '0x0000000000000000000000000000000000000000',
          symbol: 'movr',
          network: 'moonriver',
          chainId: 1285,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/17984/large/9285.png',
          price: 8.9
        },
        {
          address: '0x0000000000000000000000000000000000000000',
          symbol: 'sei',
          network: 'sei',
          chainId: 1329,
          decimals: 18,
          icon: 'https://coin-images.coingecko.com/coins/images/28205/large/Sei_Logo_-_Transparent.png',
          price: 0.30669
        },
        {
          address: '0x0000000000000000000000000000000000000000',
          symbol: 'xdai',
          network: 'gnosis',
          chainId: 100,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/11062/large/Identity-Primary-DarkBG.png',
          price: 0.999905
        },
        {
          address: '0x0000000000000000000000000000000000000000',
          symbol: 'kcs',
          network: 'kucoin',
          chainId: 321,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/1047/large/sa9z79.png',
          price: 12.32
        },
        {
          address: '0x0000000000000000000000000000000000000000',
          symbol: 'eth',
          network: 'optimism',
          chainId: 10,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
          price: 3066.11
        },
        {
          address: '0x0000000000000000000000000000000000000000',
          symbol: 'eth',
          network: 'scroll',
          chainId: 534352,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
          price: 3066.11
        },
        {
          address: '0x0000000000000000000000000000000000000000',
          symbol: 'okt',
          network: 'okc',
          chainId: 66,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/13708/large/WeChat_Image_20220118095654.png',
          price: 7.31
        },
        {
          address: '0x0000000000000000000000000000000000000000',
          symbol: 'eth',
          network: 'sepolia',
          chainId: 11155111,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
          price: 3066.11
        },
        {
          address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          symbol: 'weth',
          network: 'ethereum',
          chainId: 1,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/2518/small/weth.png?1628852295',
          isWrappedNative: true,
          price: 3071.24
        },
        {
          address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          symbol: 'usdc',
          network: 'ethereum',
          chainId: 1,
          decimals: 6,
          icon: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
          isWrappedNative: false,
          price: 1
        },
        {
          address: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
          symbol: 'steth',
          network: 'ethereum',
          chainId: 1,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/13442/standard/steth_logo.png',
          isWrappedNative: false,
          price: 3061.64
        },
        {
          address: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
          symbol: 'wsteth',
          network: 'ethereum',
          chainId: 1,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/18834/standard/wstETH.png',
          isWrappedNative: false,
          price: 3658.48
        },
        {
          address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
          symbol: 'usdt',
          network: 'ethereum',
          chainId: 1,
          decimals: 6,
          icon: 'https://assets.coingecko.com/coins/images/325/small/Tether-logo.png',
          isWrappedNative: false,
          price: 0.997132
        },
        {
          address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
          symbol: 'dai',
          network: 'ethereum',
          chainId: 1,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/9956/small/4943.png',
          isWrappedNative: false,
          price: 0.999849
        },
        {
          address: '0x4Fabb145d64652a948d72533023f6E7A623C7C53',
          symbol: 'busd',
          network: 'ethereum',
          chainId: 1,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/9576/small/BUSD.png',
          isWrappedNative: false,
          price: 0.992484
        },
        {
          address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
          symbol: 'wbtc',
          network: 'ethereum',
          chainId: 1,
          decimals: 8,
          icon: 'https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png',
          isWrappedNative: false,
          price: 98946
        },
        {
          address: '0x88800092fF476844f74dC2FC427974BBee2794Ae',
          symbol: 'wallet',
          network: 'ethereum',
          chainId: 1,
          decimals: 18,
          icon: 'https://raw.githubusercontent.com/AmbireTech/ambire-brand/main/logos/Ambire_logo_250x250.png',
          isWrappedNative: false,
          price: 0.01252114
        },
        {
          address: '0x47Cd7E91C3CBaAF266369fe8518345fc4FC12935',
          disableGasTankDeposit: true,
          disableAsFeeToken: true,
          symbol: 'xwallet',
          network: 'ethereum',
          chainId: 1,
          decimals: 18,
          icon: 'https://raw.githubusercontent.com/AmbireTech/ambire-brand/main/logos/xwallet_250x250.png',
          isWrappedNative: false,
          price: 0.25107801839139665
        },
        {
          address: '0x028171bCA77440897B824Ca71D1c56caC55b68A3',
          baseToken: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
          disableAsFeeToken: true,
          symbol: 'adai',
          network: 'ethereum',
          chainId: 1,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/10843/small/aDAI.png',
          isWrappedNative: false,
          price: 0.996254
        },
        {
          address: '0xBcca60bB61934080951369a648Fb03DF4F96263C',
          baseToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          disableAsFeeToken: true,
          symbol: 'ausdc',
          network: 'ethereum',
          chainId: 1,
          decimals: 6,
          icon: 'https://assets.coingecko.com/coins/images/17226/small/aAMMUSDC_2x.png',
          isWrappedNative: false,
          price: 0.996342
        },
        {
          address: '0x3Ed3B47Dd13EC9a98b44e6204A523E766B225811',
          baseToken: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
          disableAsFeeToken: true,
          symbol: 'ausdt',
          network: 'ethereum',
          chainId: 1,
          decimals: 6,
          icon: 'https://assets.coingecko.com/coins/images/17264/small/amUSDT_2x.png',
          isWrappedNative: false,
          price: 0.995733
        },
        {
          address: '0x9ff58f4fFB29fA2266Ab25e75e2A8b3503311656',
          baseToken: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
          disableAsFeeToken: true,
          symbol: 'awbtc',
          network: 'ethereum',
          chainId: 1,
          decimals: 8,
          icon: 'https://assets.coingecko.com/coins/images/17265/small/amWBTC_2x.png',
          isWrappedNative: false,
          price: 99311
        },
        {
          address: '0x030bA81f1c18d280636F32af80b9AAd02Cf0854e',
          baseToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          disableAsFeeToken: true,
          symbol: 'aweth',
          network: 'ethereum',
          chainId: 1,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/17266/small/amWETH_2x.png',
          isWrappedNative: false,
          price: 3068.24
        },
        {
          address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
          symbol: 'wmatic',
          network: 'polygon',
          chainId: 137,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/14073/small/matic.png',
          isWrappedNative: true,
          price: 0.400782
        },
        {
          address: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',
          symbol: 'wbtc',
          network: 'polygon',
          chainId: 137,
          decimals: 8,
          icon: 'https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png',
          isWrappedNative: false,
          price: 98946
        },
        {
          address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
          symbol: 'weth',
          network: 'polygon',
          chainId: 137,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/2518/small/weth.png',
          isWrappedNative: false,
          price: 3071.24
        },
        {
          address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
          symbol: 'dai',
          network: 'polygon',
          chainId: 137,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/9956/small/4943.png',
          isWrappedNative: false,
          price: 0.999849
        },
        {
          address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
          symbol: 'usdt',
          network: 'polygon',
          chainId: 137,
          decimals: 6,
          icon: 'https://assets.coingecko.com/coins/images/325/small/Tether-logo.png',
          isWrappedNative: false,
          price: 0.997132
        },
        {
          address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
          symbol: 'usdc.e',
          network: 'polygon',
          chainId: 137,
          decimals: 6,
          icon: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
          isWrappedNative: false,
          price: 1
        },
        {
          address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
          symbol: 'usdc',
          network: 'polygon',
          chainId: 137,
          decimals: 6,
          icon: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
          isWrappedNative: false,
          price: 1
        },
        {
          address: '0x03b54a6e9a984069379fae1a4fc4dbae93b3bccd',
          symbol: 'wsteth',
          network: 'polygon',
          chainId: 137,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/18834/standard/wstETH.png',
          isWrappedNative: false,
          price: 3658.48
        },
        {
          address: '0x8dF3aad3a84da6b69A4DA8aeC3eA40d9091B2Ac4',
          baseToken: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
          disableAsFeeToken: true,
          symbol: 'ammatic',
          network: 'polygon',
          chainId: 137,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/17267/small/amWMATIC_2x.png',
          isWrappedNative: false,
          price: 0.400782
        },
        {
          address: '0x27F8D03b3a2196956ED754baDc28D73be8830A6e',
          baseToken: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
          disableAsFeeToken: true,
          symbol: 'amdai',
          network: 'polygon',
          chainId: 137,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/10843/small/aDAI.png',
          isWrappedNative: false,
          price: 0.999401
        },
        {
          address: '0x1a13F4Ca1d028320A707D99520AbFefca3998b7F',
          baseToken: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
          disableAsFeeToken: true,
          symbol: 'amusdc',
          network: 'polygon',
          chainId: 137,
          decimals: 6,
          icon: 'https://assets.coingecko.com/coins/images/17226/small/aAMMUSDC_2x.png',
          isWrappedNative: false,
          price: 0.999162
        },
        {
          address: '0x60D55F02A771d515e077c9C2403a1ef324885CeC',
          baseToken: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
          disableAsFeeToken: true,
          symbol: 'amusdt',
          network: 'polygon',
          chainId: 137,
          decimals: 6,
          icon: 'https://assets.coingecko.com/coins/images/17264/small/amUSDT_2x.png',
          isWrappedNative: false,
          price: 0.998674
        },
        {
          address: '0x5c2ed810328349100A66B82b78a1791B101C9D61',
          baseToken: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',
          disableAsFeeToken: true,
          symbol: 'amwbtc',
          network: 'polygon',
          chainId: 137,
          decimals: 8,
          icon: 'https://assets.coingecko.com/coins/images/17265/small/amWBTC_2x.png',
          isWrappedNative: false,
          price: 99226
        },
        {
          address: '0x28424507fefb6f7f8E9D3860F56504E4e5f5f390',
          baseToken: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
          disableAsFeeToken: true,
          symbol: 'amweth',
          network: 'polygon',
          chainId: 137,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/17266/small/amWETH_2x.png',
          isWrappedNative: false,
          price: 3068.24
        },
        {
          address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
          symbol: 'busd',
          network: 'binance-smart-chain',
          chainId: 56,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/9576/small/BUSD.png',
          isWrappedNative: false,
          price: 0.992484
        },
        {
          address: '0x55d398326f99059fF775485246999027B3197955',
          symbol: 'usdt',
          network: 'binance-smart-chain',
          chainId: 56,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/325/small/Tether-logo.png',
          isWrappedNative: false,
          price: 0.997132
        },
        {
          address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
          symbol: 'usdc',
          network: 'binance-smart-chain',
          chainId: 56,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
          isWrappedNative: false,
          price: 1
        },
        {
          address: '0x049d68029688eAbF473097a2fC38ef61633A3C7A',
          symbol: 'usdt',
          network: 'fantom',
          chainId: 250,
          decimals: 6,
          icon: 'https://assets.coingecko.com/coins/images/325/small/Tether-logo.png',
          isWrappedNative: false,
          price: 0.997132
        },
        {
          address: '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75',
          symbol: 'usdc',
          network: 'fantom',
          chainId: 250,
          decimals: 6,
          icon: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
          isWrappedNative: false,
          price: 1
        },
        {
          address: '0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E',
          symbol: 'dai',
          network: 'fantom',
          chainId: 250,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/9956/small/4943.png',
          isWrappedNative: false,
          price: 0.999849
        },
        {
          address: '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7',
          symbol: 'wavax',
          network: 'avalanche',
          chainId: 43114,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/15075/small/wrapped-avax.png',
          isWrappedNative: true,
          price: 33.69
        },
        {
          address: '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70',
          symbol: 'dai',
          network: 'avalanche',
          chainId: 43114,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/9956/small/4943.png',
          isWrappedNative: false,
          price: 0.999849
        },
        {
          address: '0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664',
          symbol: 'usdc.e',
          network: 'avalanche',
          chainId: 43114,
          decimals: 6,
          icon: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
          isWrappedNative: false,
          price: 1
        },
        {
          address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
          symbol: 'usdc',
          network: 'avalanche',
          chainId: 43114,
          decimals: 6,
          icon: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
          isWrappedNative: false,
          price: 1
        },
        {
          address: '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB',
          symbol: 'weth',
          network: 'avalanche',
          chainId: 43114,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/2518/small/weth.png?1628852295',
          isWrappedNative: false,
          price: 3071.24
        },
        {
          address: '0xc7198437980c041c805A1EDcbA50c1Ce5db95118',
          symbol: 'usdt',
          network: 'avalanche',
          chainId: 43114,
          decimals: 6,
          icon: 'https://assets.coingecko.com/coins/images/325/small/Tether-logo.png',
          isWrappedNative: false,
          price: 0.997132
        },
        {
          address: '0x50b7545627a5162F82A992c33b87aDc75187B218',
          symbol: 'wbtc',
          network: 'avalanche',
          chainId: 43114,
          decimals: 8,
          icon: 'https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png',
          isWrappedNative: false,
          price: 98946
        },
        {
          address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
          symbol: 'usdc',
          network: 'avalanche',
          chainId: 43114,
          decimals: 6,
          icon: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
          isWrappedNative: false,
          price: 1
        },
        {
          address: '0x82E64f49Ed5EC1bC6e43DAD4FC8Af9bb3A2312EE',
          baseToken: '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70',
          disableAsFeeToken: true,
          symbol: 'aavadai',
          network: 'avalanche',
          chainId: 43114,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/10843/small/aDAI.png',
          isWrappedNative: false,
          price: 0.996254
        },
        {
          address: '0x625E7708f30cA75bfd92586e17077590C60eb4cD',
          baseToken: '0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664',
          disableAsFeeToken: true,
          symbol: 'aavausdc',
          network: 'avalanche',
          chainId: 43114,
          decimals: 6,
          icon: 'https://assets.coingecko.com/coins/images/17226/small/aAMMUSDC_2x.png',
          isWrappedNative: false,
          price: 0.996342
        },
        {
          address: '0x6ab707Aca953eDAeFBc4fD23bA73294241490620',
          baseToken: '0xc7198437980c041c805A1EDcbA50c1Ce5db95118',
          disableAsFeeToken: true,
          symbol: 'aavausdt',
          network: 'avalanche',
          chainId: 43114,
          decimals: 6,
          icon: 'https://assets.coingecko.com/coins/images/17264/small/amUSDT_2x.png',
          isWrappedNative: false,
          price: 0.995733
        },
        {
          address: '0x078f358208685046a11C85e8ad32895DED33A249',
          baseToken: '0x50b7545627a5162F82A992c33b87aDc75187B218',
          disableAsFeeToken: true,
          symbol: 'aavawbtc',
          network: 'avalanche',
          chainId: 43114,
          decimals: 8,
          icon: 'https://assets.coingecko.com/coins/images/17265/small/amWBTC_2x.png',
          isWrappedNative: false,
          price: 99311
        },
        {
          address: '0xe50fA9b3c56FfB159cB0FCA61F5c9D750e8128c8',
          baseToken: '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB',
          disableAsFeeToken: true,
          symbol: 'aavaweth',
          network: 'avalanche',
          chainId: 43114,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/17266/small/amWETH_2x.png',
          isWrappedNative: false,
          price: 3068.24
        },
        {
          address: '0xeFAeeE334F0Fd1712f9a8cc375f427D9Cdd40d73',
          symbol: 'usdt',
          network: 'moonbeam',
          chainId: 1284,
          decimals: 6,
          icon: 'https://assets.coingecko.com/coins/images/325/small/Tether-logo.png',
          isWrappedNative: false,
          price: 0.997132
        },
        {
          address: '0x765277EebeCA2e31912C9946eAe1021199B39C61',
          symbol: 'dai',
          network: 'moonbeam',
          chainId: 1284,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/9956/small/4943.png',
          isWrappedNative: false,
          price: 0.999849
        },
        {
          address: '0xB44a9B6905aF7c801311e8F4E76932ee959c663C',
          symbol: 'usdt',
          network: 'moonriver',
          chainId: 1285,
          decimals: 6,
          icon: 'https://assets.coingecko.com/coins/images/325/small/Tether-logo.png',
          isWrappedNative: false,
          price: 0.997132
        },
        {
          address: '0x80A16016cC4A2E6a2CACA8a4a498b1699fF0f844',
          symbol: 'dai',
          network: 'moonriver',
          chainId: 1285,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/9956/small/4943.png',
          isWrappedNative: false,
          price: 0.999849
        },
        {
          address: '0xbB06DCA3AE6887fAbF931640f67cab3e3a16F4dC',
          symbol: 'usdt',
          network: 'andromeda',
          chainId: 1088,
          decimals: 6,
          icon: 'https://assets.coingecko.com/coins/images/325/small/Tether-logo.png',
          isWrappedNative: false,
          price: 0.997132
        },
        {
          address: '0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83',
          disableGasTankDeposit: true,
          symbol: 'usdc',
          network: 'gnosis',
          chainId: 100,
          decimals: 6,
          icon: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
          isWrappedNative: false,
          price: 1
        },
        {
          address: '0x4ECaBa5870353805a9F068101A40E0f32ed605C6',
          disableGasTankDeposit: true,
          symbol: 'usdt',
          network: 'gnosis',
          chainId: 100,
          decimals: 6,
          icon: 'https://assets.coingecko.com/coins/images/325/small/Tether-logo.png',
          isWrappedNative: false,
          price: 0.997132
        },
        {
          address: '0xcB444e90D8198415266c6a2724b7900fb12FC56E',
          disableGasTankDeposit: true,
          symbol: 'eure',
          network: 'gnosis',
          chainId: 100,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/23354/standard/eur.png',
          isWrappedNative: false,
          price: 1.046
        },
        {
          address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
          symbol: 'usdt',
          network: 'optimism',
          chainId: 10,
          decimals: 6,
          icon: 'https://assets.coingecko.com/coins/images/325/small/Tether-logo.png',
          isWrappedNative: false,
          price: 0.997132
        },
        {
          address: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
          symbol: 'usdc.e',
          network: 'optimism',
          chainId: 10,
          decimals: 6,
          icon: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
          isWrappedNative: false,
          price: 1
        },
        {
          address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
          symbol: 'usdc',
          network: 'optimism',
          chainId: 10,
          decimals: 6,
          icon: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
          isWrappedNative: false,
          price: 1
        },
        {
          address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
          symbol: 'dai',
          network: 'optimism',
          chainId: 10,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/9956/small/4943.png',
          isWrappedNative: false,
          price: 0.999849
        },
        {
          address: '0x4200000000000000000000000000000000000006',
          symbol: 'weth',
          network: 'optimism',
          chainId: 10,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/2518/small/weth.png?1628852295',
          isWrappedNative: true,
          price: 3071.24
        },
        {
          address: '0x1f32b1c2345538c0c6f582fcb022739c4a194ebb',
          symbol: 'wsteth',
          network: 'optimism',
          chainId: 10,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/18834/standard/wstETH.png',
          isWrappedNative: false,
          price: 3658.48
        },
        {
          address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
          symbol: 'usdt',
          network: 'arbitrum',
          chainId: 42161,
          decimals: 6,
          icon: 'https://assets.coingecko.com/coins/images/325/small/Tether-logo.png',
          isWrappedNative: false,
          price: 0.997132
        },
        {
          address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
          symbol: 'usdc.e',
          network: 'arbitrum',
          chainId: 42161,
          decimals: 6,
          icon: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
          isWrappedNative: false,
          price: 1
        },
        {
          address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
          symbol: 'usdc',
          network: 'arbitrum',
          chainId: 42161,
          decimals: 6,
          icon: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
          isWrappedNative: false,
          price: 1
        },
        {
          address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
          symbol: 'dai',
          network: 'arbitrum',
          chainId: 42161,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/9956/small/4943.png',
          isWrappedNative: false,
          price: 0.999849
        },
        {
          address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
          symbol: 'weth',
          network: 'arbitrum',
          chainId: 42161,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/2518/small/weth.png?1628852295',
          isWrappedNative: true,
          price: 3071.24
        },
        {
          address: '0x5979d7b546e38e414f7e9822514be443a4800529',
          symbol: 'wsteth',
          network: 'arbitrum',
          chainId: 42161,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/18834/standard/wstETH.png',
          isWrappedNative: false,
          price: 3658.48
        },
        {
          address: '0x382bB369d343125BfB2117af9c149795C6C65C50',
          symbol: 'usdc',
          network: 'okc',
          chainId: 66,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
          isWrappedNative: false,
          price: 1
        },
        {
          address: '0xc946DAf81b08146B1C7A8Da2A851Ddf2B3EAaf85',
          symbol: 'usdt',
          network: 'okc',
          chainId: 66,
          decimals: 6,
          icon: 'https://assets.coingecko.com/coins/images/325/small/Tether-logo.png',
          isWrappedNative: false,
          price: 0.997132
        },
        {
          address: '0xEF71CA2EE68F45B9Ad6F72fbdb33d707b872315C',
          symbol: 'ethk',
          network: 'okc',
          chainId: 66,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/18537/small/0xef71ca2ee68f45b9ad6f72fbdb33d707b872315c.png',
          isWrappedNative: false,
          price: 3480.39
        },
        {
          address: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
          symbol: 'usdbc',
          network: 'base',
          chainId: 8453,
          decimals: 6,
          icon: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
          isWrappedNative: false,
          price: 0.999009
        },
        {
          address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
          symbol: 'dai',
          network: 'base',
          chainId: 8453,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/9956/small/4943.png',
          isWrappedNative: false,
          price: 0.999849
        },
        {
          address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          symbol: 'usdc',
          network: 'base',
          chainId: 8453,
          decimals: 6,
          icon: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
          isWrappedNative: false,
          price: 1
        },
        {
          address: '0xc1cba3fcea344f92d9239c08c0568f6f2f0ee452',
          symbol: 'wsteth',
          network: 'base',
          chainId: 8453,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/18834/standard/wstETH.png',
          isWrappedNative: false,
          price: 3658.48
        },
        {
          address: '0x4200000000000000000000000000000000000006',
          symbol: 'weth',
          network: 'base',
          chainId: 8453,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/2518/small/weth.png?1628852295',
          isWrappedNative: false,
          price: 3071.24
        },
        {
          address: '0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4',
          symbol: 'usdc',
          network: 'scroll',
          chainId: 534352,
          decimals: 6,
          icon: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
          isWrappedNative: false,
          price: 1
        },
        {
          address: '0xf55BEC9cafDbE8730f096Aa55dad6D22d44099Df',
          symbol: 'usdt',
          network: 'scroll',
          chainId: 534352,
          decimals: 6,
          icon: 'https://assets.coingecko.com/coins/images/32610/small/usdt_%281%29.png',
          isWrappedNative: false,
          price: 0.997132
        },
        {
          address: '0x5300000000000000000000000000000000000004',
          symbol: 'weth',
          network: 'scroll',
          chainId: 534352,
          decimals: 18,
          icon: 'https://assets.coingecko.com/coins/images/32315/small/weth_%281%29.png?1697365181',
          isWrappedNative: true,
          price: 3071.24
        },
        {
          address: '0xf610A9dfB7C89644979b4A0f27063E9e7d7Cda32',
          symbol: 'wsteth',
          network: 'scroll',
          chainId: 534352,
          decimals: 18,
          icon: 'https://coin-images.coingecko.com/coins/images/18834/small/wstETH.png',
          isWrappedNative: false,
          price: 3658.48
        }
      ]
    }
  },
  errorState: []
}
