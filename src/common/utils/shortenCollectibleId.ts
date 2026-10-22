const MAX_LENGTH = 10
const VISIBLE_DIGITS = 4

/**
 * Collectible IDs (ERC-721 token IDs) can be very large numbers, which are too long to
 * display in full and carry no meaning to the user beyond identifying the collectible.
 */
const shortenCollectibleId = (tokenId: bigint) => {
  const id = tokenId.toString()

  if (id.length <= MAX_LENGTH) return id

  return `${id.slice(0, VISIBLE_DIGITS)}...${id.slice(-VISIBLE_DIGITS)}`
}

export default shortenCollectibleId
