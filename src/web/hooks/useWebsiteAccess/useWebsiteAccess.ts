import { useCallback, useEffect, useState } from 'react'

import { captureException } from '@common/config/analytics/CrashAnalytics.web'
import { browser, isExtension, isSafari } from '@web/constants/browserapi'

/**
 * The website origins the wallet's content scripts run on (see handleScripting.ts). Without host
 * access to them the wallet isn't injected into any page, so dapps can't find it.
 */
const WEBSITE_ORIGINS = ['http://*/*', 'https://*/*']

const WEBSITE_ORIGIN_PREFIXES = ['http://', 'https://', '*://']

/**
 * Whether a granted host permission covers at least one website - either all of them (e.g.
 * `<all_urls>` or WEBSITE_ORIGINS) or only the ones the user picked (e.g. `https://app.uniswap.org/*`).
 */
const isWebsiteOrigin = (origin: string) =>
  origin === '<all_urls>' || WEBSITE_ORIGIN_PREFIXES.some((prefix) => origin.startsWith(prefix))

// The user can refuse or revoke host permissions at any time - in Firefox via "Access your data
// for all websites", in Chromium browsers via the extension's "Site access" setting (e.g. "On
// click"). Safari is excluded until verified: its site access is per-site and often defaults to
// "Ask", so the check could flag nearly every user there.
const canWebsiteAccessBeRevoked = isExtension && !isSafari()

/**
 * Tracks whether the extension may access any website, and lets the user grant access to all of
 * them again.
 * `hasWebsiteAccess` is `null` while unknown and on browsers where access can't be revoked.
 */
const useWebsiteAccess = () => {
  const [hasWebsiteAccess, setHasWebsiteAccess] = useState<boolean | null>(null)

  useEffect(() => {
    if (!canWebsiteAccessBeRevoked) return

    let isMounted = true

    // Access to only some websites is a deliberate choice by the user, so it counts as granted -
    // only access to no website at all hides the wallet from every app
    const checkWebsiteAccess = async () => {
      try {
        const { origins = [] }: { origins?: string[] } = await browser.permissions.getAll()
        if (isMounted) setHasWebsiteAccess(origins.some(isWebsiteOrigin))
      } catch (error) {
        console.error('Failed to check the website access permission', error)
        captureException(error)
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    checkWebsiteAccess()
    browser.permissions.onAdded.addListener(checkWebsiteAccess)
    browser.permissions.onRemoved.addListener(checkWebsiteAccess)

    return () => {
      isMounted = false
      browser.permissions.onAdded.removeListener(checkWebsiteAccess)
      browser.permissions.onRemoved.removeListener(checkWebsiteAccess)
    }
  }, [])

  /**
   * Shows the browser's permission prompt. Must be called directly from a click handler (before
   * any await), since the browser only allows permission requests during a user gesture.
   * Resolves with whether access was granted.
   */
  const requestWebsiteAccess = useCallback(async (): Promise<boolean> => {
    try {
      return await browser.permissions.request({ origins: WEBSITE_ORIGINS })
    } catch (error) {
      console.error('Failed to request the website access permission', error)
      captureException(error)
      return false
    }
  }, [])

  return { hasWebsiteAccess, requestWebsiteAccess }
}

export default useWebsiteAccess
