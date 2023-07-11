interface AssetV2 {
  tokenId: string
  balance: number
  original_owner: string
  token_url: string
  data: {
    name: string
    description: string
    image: string
    image_256: string
    image_512: string
    image_1024: string
    attributes: {
      trait_type: string
      value: string
    }[]
  }
}

interface NFTV2 {
  type: string
  address: string
  decimals: number
  symbol: string
  price: number
  balance: number
  balanceUSD: number
  shouldDisplay: boolean
  collectionId: string
  collectionName: string
  collectionHidden: boolean
  collection: {
    id: string
    name: string
    hidden: boolean
  }
  assets: AssetV2[]
}

interface TokenV2 {
  type: string
  address: string
  decimals: number
  symbol: string
  name: string
  coingeckoId: string
  tokenImageUrl: string
  tokenImageUrls: {
    thumb: string
    small: string
    large: string
  }
  balance: number
  balanceRaw: string
  price: number
  balanceUSD: number
  priceUpdate: number
  balanceUpdate: number
}

interface ResponseV2 {
  success: boolean
  data: {
    success: boolean
    tokens: TokenV2[]
    nfts: NFTV2[]
    resultTime: number
    provider: string
    error: null | string
    identity: string
    network: string
  }
}

interface TokenV1 {
  type: string
  balanceUSD: number
  tokens: {
    network: string
    address: string
    decimals: number
    symbol: string
    price: number
    balance: number
    balanceRaw: string
    balanceUSD: number
    tokenImageUrl: string
  }[]
}

interface NFTV1 {
  type: string
  balanceUSD: number
  balance: number
  tokens: {
    type: string
    network: string
    address: string
    decimals: number
    symbol: string
    price: number
    balance: number
    balanceRaw: string
    balanceUSD: number
    tokenImageUrl: string
    category: string
    shouldDisplay: boolean
    collectionId: string
    collectionName: string
    collectionHidden: boolean
    collectionImg: string
    collection: {
      id: string
      name: string
      hidden: boolean
      floorPrice: number
      floorPriceUSD: number
      owners: number
      items: number
      volume24h: number
      volume24hUSD: number
    }
    assets: {
      tokenId: string
      balance: number
      assetImg: string
      balanceUSD: number
    }[]
  }[]
}

interface ResponseV1 {
  [address: string]: {
    products: {
      label: string
      assets: (TokenV1 | NFTV1)[]
    }[]
    meta: {
      label: string
      value: number
      type: string
    }[]
    systemInfo: {
      source: number
      updateAt: number
      nextUpdate: number
    }
  }
}

export function normalizeResponse(response: ResponseV2, protocol): ResponseV1 {
  try {
    // console.log('response identity', response)
    const v1Response: ResponseV1 = {
      [response.data.identity]: {
        products: [],
        // TODO: What are these?
        meta: [
          {
            label: 'Total',
            value: 0,
            type: 'dollar'
          },
          {
            label: 'Assets',
            value: 0,
            type: 'dollar'
          },
          {
            label: 'Debt',
            value: 0,
            type: 'dollar'
          }
        ],
        systemInfo: {
          source: 5, // TODO: static source value?
          updateAt: response.data.resultTime,
          nextUpdate: response.data.resultTime + 600000 // TODO: Assume update interval of 10 minutes?
        }
      }
    }

    // Normalizing tokens
    if (response.data.tokens && protocol === 'tokens') {
      // console.log('tokens v2', response.data.tokens)
      const tokenAssets: TokenV1[] = response.data.tokens.map((token) => {
        return {
          type: 'wallet', // "wallet" (v1) vs "token" (v2)
          balanceUSD: token.balanceUSD,
          tokens: [
            {
              type: 'base', // "base" (v1) vs "token" (v2)
              network: response.data.network,
              address: token.address,
              decimals: token.decimals,
              symbol: token.symbol,
              price: token.price,
              balance: token.balance,
              balanceRaw: token.balanceRaw,
              balanceUSD: token.balanceUSD,
              tokenImageUrl: token.tokenImageUrl
            }
          ]
        }
      })

      // console.log('tokenAssets', tokenAssets)

      v1Response[response.data.identity].products.push({
        label: 'Tokens',
        assets: tokenAssets
      })
    }

    // Normalizing NFTs
    if (response.data.nfts && protocol === 'nfts') {
      const nftAssets: NFTV1[] = response.data.nfts
        .map((nft) => {
          return {
            type: 'nft',
            balanceUSD: nft.balanceUSD,
            balance: nft.balance,
            tokens: [
              {
                type: 'nft',
                network: response.data.network,
                address: nft.address,
                decimals: nft.decimals,
                symbol: nft.symbol,
                price: nft.price,
                balance: nft.balance,
                balanceRaw: nft.balance.toString(), // As NFTs usually don't have decimal places, raw balance is same as balance.
                balanceUSD: nft.balanceUSD,
                tokenImageUrl: nft.assets[0].token_url,
                category: 'NFT',
                shouldDisplay: nft.shouldDisplay,
                collectionId: nft.collectionId,
                collectionName: nft.collectionName,
                collectionHidden: nft.collectionHidden,
                collectionImg: nft.assets[0].token_url,
                collection: {
                  id: nft.collection.id,
                  name: nft.collection.name,
                  hidden: nft.collection.hidden,
                  floorPrice: 0, // Placeholder, as we don't have floor price in the v2 response
                  floorPriceUSD: 0, // Placeholder, as we don't have floor price in USD in the v2 response
                  owners: 0, // Placeholder, as we don't have owner information in the v2 response
                  items: nft.assets.length,
                  volume24h: 0, // Placeholder, as we don't have 24h volume in the v2 response
                  volume24hUSD: 0 // Placeholder, as we don't have 24h volume in USD in the v2 response
                },
                assets: nft.assets.map((asset) => {
                  return {
                    tokenId: asset.tokenId,
                    balance: asset.balance,
                    assetImg: asset.token_url,
                    balanceUSD: 0 // Placeholder, as we don't have asset-specific balance in USD in the v2 response
                  }
                })
                // TODO:
                // assets: nft.assets.map((asset) => {
                //   if (asset) {
                //     return {
                //       tokenId: asset.tokenId,
                //       balance: asset.balance,
                //       assetImg: asset.token_url,
                //       balanceUSD: 0 // Placeholder, as we don't have asset-specific balance in USD in the v2 response
                //     }
                //   }
                // })
              }
            ]
          }
        })
        .filter(Boolean) // This will filter out any undefined elements in the array

      v1Response[response.data.identity].products.push({
        label: 'Collectibles',
        assets: nftAssets
      })
    }

    console.log('v1Response', v1Response)

    return v1Response
  } catch (e) {
    console.log('ERRROR', e)
  }
}
