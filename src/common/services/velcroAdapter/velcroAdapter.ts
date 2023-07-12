import { VelcroV1NFT, VelcroV1Response, VelcroV1Token, VelcroV2Response } from './types'

export function adaptVelcroV2ResponseToV1Structure(
  response: VelcroV2Response,
  protocol,
  network
): VelcroV1Response {
  try {
    // console.log('response identity', response)
    const v1Response: VelcroV1Response = {
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
      const tokenAssets: VelcroV1Token[] = response.data.tokens.map((token) => {
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

      if (network === 'ethereum') console.log('tokenAssets', tokenAssets)

      v1Response[response.data.identity].products.push({
        label: 'Tokens',
        assets: tokenAssets
      })
    }

    // Normalizing NFTs
    if (response.data.nfts && protocol === 'nft') {
      const nftAssets: VelcroV1NFT[] = response.data.nfts
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
        label: 'NFTs',
        assets: nftAssets,
        meta: []
      })
    }

    if (network === 'ethereum') console.log('v1Response', v1Response)

    return v1Response
  } catch (e) {
    console.log('ERRROR', e)
  }
}
