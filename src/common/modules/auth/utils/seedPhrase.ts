import { wordlists } from 'bip39'
import { Mnemonic } from 'ethers'

const ENGLISH_WORDLIST: readonly string[] = wordlists.english || []
const ENGLISH_WORDS = new Set(ENGLISH_WORDLIST)

/**
 * Word counts allowed by BIP39 (128 to 256 bits of entropy, in 32 bit steps).
 */
export const VALID_SEED_PHRASE_WORD_COUNTS = [12, 15, 18, 21, 24]
const MAX_SEED_PHRASE_WORD_COUNT = 24

export type SeedPhraseStatus = 'incomplete' | 'valid' | 'invalid'

/**
 * A chunk of the raw seed phrase input. Whitespace is kept as separate tokens,
 * so joining all token values gives back the original input.
 */
export type SeedPhraseToken = {
  value: string
  /**
   * Position of the token in the raw input. Unique and stable, so it can be used as a list key
   */
  startIndex: number
  isWhitespace: boolean
  /**
   * The last word, not followed by whitespace, which is the beginning of a
   * BIP39 word but not a complete one yet
   */
  isBeingTyped: boolean
  isInvalidWord: boolean
}

const isWhitespaceChar = (char: string) => char.trim() === ''

const isBip39Word = (word: string) => ENGLISH_WORDS.has(word.toLowerCase())

const isBip39WordPrefix = (prefix: string) => {
  const lowercasePrefix = prefix.toLowerCase()

  return ENGLISH_WORDLIST.some((word) => word.startsWith(lowercasePrefix))
}

/**
 * Groups consecutive whitespace and consecutive non-whitespace characters.
 */
const splitIntoChunks = (seed: string) => {
  const chunks: string[] = []

  for (const char of seed) {
    const lastIndex = chunks.length - 1
    const lastChunk = chunks[lastIndex]

    if (lastChunk && isWhitespaceChar(lastChunk[0]!) === isWhitespaceChar(char)) {
      chunks[lastIndex] = lastChunk + char
    } else {
      chunks.push(char)
    }
  }

  return chunks
}

/**
 * Splits the seed phrase into its lowercase words, ignoring any whitespace.
 */
export const getSeedPhraseWords = (seed: string) =>
  splitIntoChunks(seed)
    .filter((chunk) => !isWhitespaceChar(chunk[0]!))
    .map((word) => word.toLowerCase())

/**
 * Trims, lowercases and collapses all whitespace (spaces, tabs, new lines) between
 * the words into single spaces. This is the format expected by the keystore.
 */
export const normalizeSeedPhrase = (seed: string) => getSeedPhraseWords(seed).join(' ')

/**
 * Splits the raw input into word and whitespace tokens and marks the words that
 * are not part of the BIP39 english wordlist. The word that is still being typed
 * is not marked as invalid until it can no longer become a valid word.
 */
export const getSeedPhraseTokens = (seed: string): SeedPhraseToken[] => {
  const chunks = splitIntoChunks(seed)
  let startIndex = 0

  return chunks.map((chunk, index) => {
    const chunkStartIndex = startIndex
    startIndex += chunk.length

    const isWhitespace = isWhitespaceChar(chunk[0]!)
    const isWord = !isWhitespace && isBip39Word(chunk)
    const isBeingTyped =
      !isWhitespace && !isWord && index === chunks.length - 1 && isBip39WordPrefix(chunk)

    return {
      value: chunk,
      startIndex: chunkStartIndex,
      isWhitespace,
      isBeingTyped,
      isInvalidWord: !isWhitespace && !isWord && !isBeingTyped
    }
  })
}

/**
 * - `incomplete` - the user hasn't typed anything or is still typing
 * - `invalid` - there is an unknown word, there are too many words, or the
 *   phrase has a valid length but the words don't form a valid recovery phrase
 *   (e.g. wrong order or a mistyped word)
 * - `valid` - the phrase can be imported
 */
export const getSeedPhraseStatus = (seed: string): SeedPhraseStatus => {
  const tokens = getSeedPhraseTokens(seed)
  const words = getSeedPhraseWords(seed)

  if (tokens.some((token) => token.isInvalidWord)) return 'invalid'
  if (words.length > MAX_SEED_PHRASE_WORD_COUNT) return 'invalid'
  if (tokens.some((token) => token.isBeingTyped)) return 'incomplete'
  if (!VALID_SEED_PHRASE_WORD_COUNTS.includes(words.length)) return 'incomplete'

  return Mnemonic.isValidMnemonic(words.join(' ')) ? 'valid' : 'invalid'
}
