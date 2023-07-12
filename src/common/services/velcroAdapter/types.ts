export interface VelcroV2Asset {
  tokenId: string
  balance: string
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

export interface VelcroV2NFT {
  type: string
  address: string
  decimals: number
  symbol: string
  price: number
  balance: string
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
  assets: VelcroV2Asset[]
}

export interface VelcroV2Token {
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

export interface VelcroV2Response {
  success: boolean
  data: {
    success: boolean
    tokens: VelcroV2Token[]
    nfts: VelcroV2NFT[]
    resultTime: number
    cache?: boolean
    cacheTime?: number
    provider: string
    error: null | string
    identity: string
    network: string
  }
}

export interface VelcroV1Token {
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

export interface VelcroV1NFT {
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

export interface VelcroV1Response {
  [address: string]: {
    products: {
      label: string
      assets: (VelcroV1Token | VelcroV1NFT)[]
      meta: []
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
