import { VelcroV1NFT, VelcroV1Response, VelcroV1Token, VelcroV2Response } from './types'

export function adaptVelcroV2ResponseToV1Structure(
  response: VelcroV2Response,
  protocol: 'tokens' | 'nft'
): VelcroV1Response {
  try {
    const updateAt =
      response.data.cache && response.data.cacheTime
        ? response.data.cacheTime
        : response.data.resultTime

    const v1Response: VelcroV1Response = {
      [response.data.identity]: {
        products: [],
        // Not displayed anywhere in the app, but part of the application logic,
        // so we need to keep it in the response as a placeholder
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
          // Matches the "provider" logic in v2, not used in the application logic
          source: 5,
          updateAt,
          // Assumes update interval of 10 minutes, not used in the application logic
          nextUpdate: updateAt + 600000
        }
      }
    }

    // Handling tokens separately, since in v2 both tokens and NFTs come together
    if (response.data.tokens && protocol === 'tokens') {
      const tokenAssets: VelcroV1Token[] = response.data.tokens.map((token) => {
        return {
          type: 'wallet', // "wallet" in v1 is changed to "token" in v2
          balanceUSD: token.balanceUSD, // not used in the application logic, keep it for consistency
          tokens: [
            {
              type: 'base', // "base" in v1 is changed to "token" in v2
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

      v1Response[response.data.identity].products.push({
        label: 'Tokens',
        assets: tokenAssets,
        meta: [] // not used in the application logic, kept as a placeholder
      })
    }

    // Handling NFTs separately, since in v2 both tokens and NFTs come together
    if (response.data.nfts && protocol === 'nft') {
      const nftAssets: VelcroV1NFT[] = response.data.nfts.map((nft) => {
        return {
          type: 'nft',
          balanceUSD: nft.balanceUSD,
          balance: +nft.balance,
          tokens: [
            {
              type: nft.type,
              network: response.data.network,
              address: nft.address,
              decimals: nft.decimals,
              symbol: nft.symbol,
              price: nft.price,
              balance: +nft.balance,
              balanceRaw: nft.balance,
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
                owners: 1, // Placeholder, as we don't have owner information in the v2 response
                items: nft.assets.length,
                volume24h: 0, // Placeholder, as we don't have 24h volume in the v2 response
                volume24hUSD: 0 // Placeholder, as we don't have 24h volume in USD in the v2 response
              },
              assets: nft.assets.map((asset) => {
                return {
                  tokenId: asset.tokenId,
                  balance: +asset.balance,
                  assetImg: asset.token_url,
                  balanceUSD: 0 // Placeholder, as we don't have asset-specific balance in USD in the v2 response
                }
              })
            }
          ]
        }
      })

      v1Response[response.data.identity].products.push({
        label: 'NFTs',
        assets: nftAssets,
        meta: [] // not used in the application logic
      })
    }

    return v1Response
  } catch (e) {
    throw new Error('Error adapting Velcro v2 response to v1 structure')
  }
}
