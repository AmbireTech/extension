import { getDomain, getHostname } from 'tldts'

type LoadableDappIconParams = {
  /** The url of the icon the site declares */
  icon?: string | null
  /** The site's url or hostname */
  siteUrl?: string | null
  /** Catalog apps use the catalog's icon instead of the one their page declares */
  isInAppCatalog: boolean
}

/** The site a url belongs to - its root domain, or its hostname when it has none (localhost, IP) */
const getSiteKey = (url: string) =>
  getDomain(url, { allowPrivateDomains: true }) || getHostname(url) || null

/**
 * Whether the wallet can show a site's icon without telling anyone new that the user is on the site.
 * The icon is loaded from wherever the page says, so an icon on another host would give that host
 * the user's IP address and the moment they opened the wallet on the site. An icon on the site's own
 * domain only reaches the site the user is already on. On shared hosting ("my-app.vercel.app") the
 * icon has to be on the site's own part of the domain, not just on the same platform.
 */
const canLoadDappIcon = ({ icon, siteUrl, isInAppCatalog }: LoadableDappIconParams): boolean => {
  if (!icon) return false
  if (isInAppCatalog) return true
  // Inline icons are part of the page itself, so showing them makes no request
  if (icon.startsWith('data:')) return true
  if (!siteUrl) return false

  const iconSite = getSiteKey(icon)
  return !!iconSite && iconSite === getSiteKey(siteUrl)
}

/**
 * The icon to show for a site, or an empty string when it can't be loaded (see `canLoadDappIcon`),
 * so the fallback icon is shown instead.
 */
const getLoadableDappIcon = (params: LoadableDappIconParams): string =>
  canLoadDappIcon(params) ? (params.icon ?? '') : ''

export { canLoadDappIcon, getLoadableDappIcon }
