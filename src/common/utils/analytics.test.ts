import { attachBalanceHint, isAmbireAnalyticsEnabled } from './analytics'

const ADDR = '0x1234567890123456789012345678901234567890'
const HINT = `panVal={"a":"${ADDR}","b":42}`

describe('attachBalanceHint', () => {
  it('leaves non-cena urls untouched', () => {
    const relayerUrl = 'https://relayer.ambire.com/v2/identity/0xaBcD/by-networks'

    expect(attachBalanceHint(relayerUrl, ADDR, 42)).toBe(relayerUrl)
  })

  // The trailing slash in CENA_URL is what keeps this a host match rather than a prefix
  // match. Without it the account address and balance would leak to a look-alike domain
  it('does not treat a look-alike domain as cena', () => {
    const lookAlikeUrl = 'https://cena.ambire.com.attacker.tld/steal'

    expect(attachBalanceHint(lookAlikeUrl, ADDR, 42)).toBe(lookAlikeUrl)
  })

  // No query string, e.g. the token icon proxy
  it('appends the hint with a `?` when the url carries no query yet', () => {
    expect(attachBalanceHint('https://cena.ambire.com/iconProxy/ethereum/0xaBcD', ADDR, 42)).toBe(
      `https://cena.ambire.com/iconProxy/ethereum/0xaBcD?${HINT}`
    )
  })

  // The real price route, which joins the addresses with an encoded comma (`%2C`)
  it('appends the hint with an `&` and keeps the encoded params as they came in', () => {
    const priceUrl =
      'https://cena.ambire.com/api/v3/simple/token_price/ethereum?contract_addresses=0xaBcD%2C0xEf01&vs_currencies=usd'

    expect(attachBalanceHint(priceUrl, ADDR, 42)).toBe(`${priceUrl}&${HINT}`)
  })

  // Hypothetical for cena today, but this is the case that used to silently break: decoding
  // the whole url turns an encoded `&` or `=` into a real separator and splits one param in two
  it('does not turn encoded separators of the incoming url into real ones', () => {
    const url = 'https://cena.ambire.com/api/v3/simple/price?ids=a%26vs_currencies%3Deur'

    expect(attachBalanceHint(url, ADDR, 42)).toBe(`${url}&${HINT}`)
  })

  // Hypothetical for cena too, but plain concatenation would otherwise bury the hint
  // inside the fragment, where it never reaches the server
  it('appends the hint before the hash, so it stays part of the query', () => {
    expect(
      attachBalanceHint('https://cena.ambire.com/api/v3/simple/price?ids=eth#frag', ADDR, 42)
    ).toBe(`https://cena.ambire.com/api/v3/simple/price?ids=eth&${HINT}#frag`)
  })
})

describe('isAmbireAnalyticsEnabled', () => {
  const flags = (isOn: boolean, initialLoadPromise?: Promise<void>) => ({
    initialLoadPromise,
    isFeatureEnabled: () => isOn
  })

  it('is on once the flags are loaded and the user has not opted out', () => {
    expect(isAmbireAnalyticsEnabled(flags(true))).toBe(true)
  })

  it('is off when the user opted out', () => {
    expect(isAmbireAnalyticsEnabled(flags(false))).toBe(false)
  })

  // Before the stored choice loads, the flags hold the defaults (on), which would
  // send the headers for a user who opted out
  it('is off while the flags are still loading from storage', () => {
    expect(isAmbireAnalyticsEnabled(flags(true, Promise.resolve()))).toBe(false)
  })

  it('is off before the controllers exist', () => {
    expect(isAmbireAnalyticsEnabled(undefined)).toBe(false)
  })
})
