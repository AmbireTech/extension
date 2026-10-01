import normalizeSeedPhrase from './normalizeSeedPhrase'

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
