import { canLoadDappIcon, getLoadableDappIcon } from './dappIcon'

const check = (icon: string | null, siteUrl: string | null, isInAppCatalog = false) =>
  canLoadDappIcon({ icon, siteUrl, isInAppCatalog })

describe('dappIcon', () => {
  describe('canLoadDappIcon', () => {
    it('loads an icon on the site own domain', () => {
      expect(check('https://app.example.xyz/favicon.ico', 'https://app.example.xyz')).toBe(true)
      expect(check('https://example.xyz/logo.png', 'https://app.example.xyz')).toBe(true)
      expect(check('https://cdn.example.xyz/logo.png', 'app.example.xyz')).toBe(true)
    })

    it('does not load an icon from another host', () => {
      expect(check('https://res.cloudinary.com/logo.png', 'https://app.example.xyz')).toBe(false)
      expect(check('https://app.uniswap.org/favicon.png', 'https://uniswap-claim.xyz')).toBe(false)
    })

    it('does not load an icon from another site on the same shared hosting', () => {
      expect(check('https://other.vercel.app/logo.png', 'https://my-app.vercel.app')).toBe(false)
      expect(check('https://my-app.vercel.app/logo.png', 'https://my-app.vercel.app')).toBe(true)
    })

    it('loads the icon of catalog apps from anywhere', () => {
      expect(
        check('https://icons.llamao.fi/icons/protocols/uniswap', 'app.uniswap.org', true)
      ).toBe(true)
    })

    it('loads inline icons, as they make no request', () => {
      expect(check('data:image/png;base64,iVBORw0KGgo=', 'https://app.example.xyz')).toBe(true)
    })

    it('loads icons of sites without a public domain only from the same host', () => {
      expect(check('http://localhost:3000/logo.png', 'http://localhost:3000')).toBe(true)
      expect(check('http://127.0.0.1:8080/logo.png', 'http://127.0.0.1:8080')).toBe(true)
      expect(check('https://res.cloudinary.com/logo.png', 'http://localhost:3000')).toBe(false)
    })

    it('does not load anything without an icon or a site', () => {
      expect(check(null, 'https://app.example.xyz')).toBe(false)
      expect(check('', 'https://app.example.xyz')).toBe(false)
      expect(check('https://app.example.xyz/logo.png', null)).toBe(false)
    })
  })

  describe('getLoadableDappIcon', () => {
    it('returns the icon only when it can be loaded', () => {
      expect(
        getLoadableDappIcon({
          icon: 'https://example.xyz/logo.png',
          siteUrl: 'example.xyz',
          isInAppCatalog: false
        })
      ).toBe('https://example.xyz/logo.png')
      expect(
        getLoadableDappIcon({
          icon: 'https://cdn.other.com/logo.png',
          siteUrl: 'example.xyz',
          isInAppCatalog: false
        })
      ).toBe('')
    })
  })
})
