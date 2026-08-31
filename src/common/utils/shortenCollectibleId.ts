const MAX_LENGTH = 10
const VISIBLE_DIGITS = 4

/**
 * Ids of collectibles are sometimes hashes, which are too long to be displayed
 * in full and carry no meaning to the user beyond identifying the collectible.
 */
const shortenCollectibleId = (tokenId: bigint) => {
  const id = tokenId.toString()

  if (id.length <= MAX_LENGTH) return id

  return `${id.slice(0, VISIBLE_DIGITS)}...${id.slice(-VISIBLE_DIGITS)}`
}

export default shortenCollectibleId
