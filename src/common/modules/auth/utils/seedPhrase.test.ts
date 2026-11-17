import { getSeedPhraseValidation, normalizeSeedPhrase } from './seedPhrase'

describe('normalizeSeedPhrase', () => {
  test('expands exact prefixes while preserving complete short words', () => {
    expect(normalizeSeedPhrase('act able aban aband abando abandon abou')).toBe(
      'act able abandon abandon abandon abandon about'
    )
  })

  test('leaves short fragments, suffix typos, overlong words and unknown prefixes unchanged', () => {
    const invalidWords = 'abo abanx abandx abandox abandonx zzzz'

    expect(normalizeSeedPhrase(invalidWords)).toBe(invalidWords)
  })

  test('normalizes seed case and whitespace before expanding prefixes', () => {
    expect(normalizeSeedPhrase(' \tACT  ABAN\nABOU \r\n')).toBe('act abandon about')
  })
})

describe('getSeedPhraseValidation', () => {
  const withCaretAtEnd = (seed: string) => getSeedPhraseValidation(seed, seed.length)

  test('accepts a phrase of fragments while the caret is on the last fragment', () => {
    expect(withCaretAtEnd([...Array(11).fill('aban'), 'abou'].join(' '))).toEqual({
      status: 'valid',
      error: null
    })
  })

  test('shows the checksum error right away when the caret is on a fragment', () => {
    expect(withCaretAtEnd(Array(12).fill('aban').join(' '))).toEqual({
      status: 'invalid',
      error: 'invalid-phrase'
    })
  })

  test('waits with the checksum error while the active word can become a longer word', () => {
    expect(withCaretAtEnd([...Array(11).fill('aban'), 'act'].join(' '))).toEqual({
      status: 'incomplete',
      error: null
    })
  })
})
