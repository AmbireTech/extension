const NFT_TOKEN_ID_MAX_LENGTH = 9
const NFT_NAME_MAX_LENGTH = 12
const ELLIPSIS = '...'

/**
 * Shortens a long NFT id (e.g. the 77-digit ids of ENS names) to its first and last digits,
 * so it fits on one line while NFTs of the same collection stay distinguishable.
 */
export const getVisibleNftTokenId = (tokenId: string, maxLength = NFT_TOKEN_ID_MAX_LENGTH) => {
  if (tokenId.length <= maxLength) return tokenId

  const edgeLength = Math.floor((maxLength - ELLIPSIS.length) / 2)

  return `${tokenId.slice(0, edgeLength)}${ELLIPSIS}${tokenId.slice(-edgeLength)}`
}

/** Cuts a collection name longer than `maxLength`, so the token id next to it stays visible. */
export const getVisibleNftName = (name: string, maxLength = NFT_NAME_MAX_LENGTH) =>
  name.length > maxLength ? `${name.slice(0, maxLength).trimEnd()}${ELLIPSIS}` : name
