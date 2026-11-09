import { getWcPairingUriFromLink } from '.'

const TOPIC = '7f6e504bfad60b485450578e05678ed3e8e8c4751d3c6160be17160d63ec90f9'
const SYM_KEY = '587d5484ce2a2a6ee3ba1962fdd7e8588e06200c46823bd18fbd67def96ad303'
const PAIRING_URI = `wc:${TOPIC}@2?relay-protocol=irn&symKey=${SYM_KEY}`

describe('getWcPairingUriFromLink', () => {
  it('returns a raw pairing URI as is', () => {
    expect(getWcPairingUriFromLink(PAIRING_URI)).toBe(PAIRING_URI)
  })

  it('unwraps a pairing URI from Ambire links', () => {
    const encodedUri = encodeURIComponent(PAIRING_URI)

    expect(getWcPairingUriFromLink(`ambire://wc?uri=${encodedUri}`)).toBe(PAIRING_URI)
    expect(getWcPairingUriFromLink(`https://ambire.com/wc?uri=${encodedUri}`)).toBe(PAIRING_URI)
  })

  // What the WalletConnect SDK opens for each request after an Android "Open with" pairing (#8279)
  it('returns null for the request redirect of an Android pairing', () => {
    expect(
      getWcPairingUriFromLink(`wc:${TOPIC}@2/wc?requestId=1794221776204141&sessionTopic=${TOPIC}`)
    ).toBeNull()
  })

  it('returns null for links without a pairing key', () => {
    expect(getWcPairingUriFromLink(`wc:${TOPIC}@2`)).toBeNull()
    expect(getWcPairingUriFromLink(`wc:${TOPIC}@2?relay-protocol=irn`)).toBeNull()
    expect(
      getWcPairingUriFromLink(`ambire://wc?uri=${encodeURIComponent(`wc:${TOPIC}@2`)}`)
    ).toBeNull()
  })

  it('returns null for request redirects to Ambire links', () => {
    expect(getWcPairingUriFromLink('ambire://wc')).toBeNull()
    expect(getWcPairingUriFromLink(`ambire://wc?requestId=1&sessionTopic=${TOPIC}`)).toBeNull()
  })

  it('returns null for links that are not WalletConnect ones', () => {
    expect(getWcPairingUriFromLink('https://app.safe.global')).toBeNull()
    expect(
      getWcPairingUriFromLink(`https://evil.example/wc?uri=${encodeURIComponent(PAIRING_URI)}`)
    ).toBeNull()
  })

  it('returns null for a wrapped URI that cannot be decoded', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})

    expect(getWcPairingUriFromLink('ambire://wc?uri=%E0%A4%A')).toBeNull()
  })
})
