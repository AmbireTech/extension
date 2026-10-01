import { wordlists } from 'bip39'

const wordsByPrefix = new Map((wordlists.english || []).map((word) => [word.slice(0, 4), word]))

/** Expands English BIP39 prefixes of at least four letters without correcting typos. */
const normalizeSeedPhrase = (seed: string): string =>
  seed
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => {
      const fullWord = wordsByPrefix.get(word.slice(0, 4))
      return fullWord?.startsWith(word) ? fullWord : word
    })
    .join(' ')

export default normalizeSeedPhrase
