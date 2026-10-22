import { wordlists } from 'bip39'
import { Mnemonic } from 'ethers'

const ENGLISH_WORDLIST: readonly string[] = wordlists.english || []
const ENGLISH_WORDS = new Set(ENGLISH_WORDLIST)

/**
 * Word counts allowed by BIP39 (128 to 256 bits of entropy, in 32 bit steps).
 */
export const VALID_SEED_PHRASE_WORD_COUNTS = [12, 15, 18, 21, 24]
const MAX_SEED_PHRASE_WORD_COUNT = 24

/**
 * Invisible characters that `String.prototype.trim` doesn't remove, but often end up
 * in text copied from web pages or PDFs. They are treated as whitespace.
 */
const INVISIBLE_CHARS = new Set(['​', '‌', '‍', '⁠', '﻿'])

export type SeedPhraseStatus = 'incomplete' | 'valid' | 'invalid'

export type SeedPhraseError = 'unknown-words' | 'wrong-word-count' | 'invalid-phrase'

export type SeedPhraseValidation = {
  status: SeedPhraseStatus
  error: SeedPhraseError | null
}

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
   * The caret is inside or right after this word
   */
  isActive: boolean
  /**
   * The active word is the beginning of a BIP39 word, but not a complete one yet
   */
  isBeingTyped: boolean
  isInvalidWord: boolean
}

const isWhitespaceChar = (char: string) => char.trim() === '' || INVISIBLE_CHARS.has(char)

const isBip39Word = (word: string) => ENGLISH_WORDS.has(word.toLowerCase())

const isBip39WordPrefix = (prefix: string) => {
  const lowercasePrefix = prefix.toLowerCase()

  return ENGLISH_WORDLIST.some((word) => word.startsWith(lowercasePrefix))
}

/**
 * Whether there is a longer BIP39 word starting with this one (e.g. "act" -> "action")
 */
const canBecomeLongerBip39Word = (word: string) => {
  const lowercaseWord = word.toLowerCase()

  return ENGLISH_WORDLIST.some((w) => w !== lowercaseWord && w.startsWith(lowercaseWord))
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
 * are not part of the BIP39 english wordlist.
 *
 * @param caretPosition - the caret position in the input, or `null` when the input
 * is not focused. The word at the caret is not marked as invalid while it can still
 * become a valid word, so words are not flagged while they are being typed.
 */
export const getSeedPhraseTokens = (
  seed: string,
  caretPosition: number | null = null
): SeedPhraseToken[] => {
  let startIndex = 0

  return splitIntoChunks(seed).map((chunk) => {
    const chunkStartIndex = startIndex
    startIndex += chunk.length

    const isWhitespace = isWhitespaceChar(chunk[0]!)
    const isWord = !isWhitespace && isBip39Word(chunk)
    const isActive =
      !isWhitespace &&
      caretPosition !== null &&
      caretPosition > chunkStartIndex &&
      caretPosition <= startIndex
    const isBeingTyped = isActive && !isWord && isBip39WordPrefix(chunk)

    return {
      value: chunk,
      startIndex: chunkStartIndex,
      isWhitespace,
      isActive,
      isBeingTyped,
      isInvalidWord: !isWhitespace && !isWord && !isBeingTyped
    }
  })
}

const incomplete: SeedPhraseValidation = { status: 'incomplete', error: null }
const invalid = (error: SeedPhraseError): SeedPhraseValidation => ({ status: 'invalid', error })

/**
 * - `incomplete` - the input is empty or the user is still typing
 * - `invalid` - there is an unknown word, the number of words is wrong, or the
 *   words don't form a valid recovery phrase (e.g. wrong order or a mistyped word)
 * - `valid` - the phrase can be imported
 *
 * The caret position never changes whether the phrase is `valid`. It only
 * delays the errors while the user is still typing.
 *
 * @param caretPosition - the caret position in the input, or `null` when the input is not focused
 */
export const getSeedPhraseValidation = (
  seed: string,
  caretPosition: number | null = null
): SeedPhraseValidation => {
  const tokens = getSeedPhraseTokens(seed, caretPosition)
  const words = getSeedPhraseWords(seed)
  const isFocused = caretPosition !== null

  if (!words.length) return incomplete
  if (tokens.some((token) => token.isInvalidWord)) return invalid('unknown-words')
  if (words.length > MAX_SEED_PHRASE_WORD_COUNT) return invalid('wrong-word-count')
  if (tokens.some((token) => token.isBeingTyped)) return incomplete
  if (!VALID_SEED_PHRASE_WORD_COUNTS.includes(words.length)) {
    return isFocused ? incomplete : invalid('wrong-word-count')
  }
  if (Mnemonic.isValidMnemonic(words.join(' '))) return { status: 'valid', error: null }

  const activeWord = tokens.find((token) => token.isActive)
  const isActiveWordStillBeingTyped = !!activeWord && canBecomeLongerBip39Word(activeWord.value)

  return isActiveWordStillBeingTyped ? incomplete : invalid('invalid-phrase')
}
