const NFT_TOKEN_ID_MAX_LENGTH = 9

/**
 * Shortens a long NFT id (e.g. the 77-digit ids of ENS names) to its first and last digits,
 * so it fits on one line while NFTs of the same collection stay distinguishable.
 */
export const getVisibleNftTokenId = (tokenId: string) =>
  tokenId.length > NFT_TOKEN_ID_MAX_LENGTH
    ? `${tokenId.slice(0, 3)}...${tokenId.slice(-3)}`
    : tokenId
