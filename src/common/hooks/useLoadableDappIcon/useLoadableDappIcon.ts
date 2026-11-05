import { useMemo } from 'react'
import { getDomain } from 'tldts'

import { getDappIdFromUrl } from '@ambire-common/libs/dapps/helpers'
import type { AllControllersMappingType } from '@common/constants/controllersMapping'
import useController from '@common/hooks/useController'
import { getLoadableDappIcon } from '@common/utils/dappIcon'

const selectDapps = (state: AllControllersMappingType['DappsController']) => state.dapps

/**
 * The icon to show for a site known only by its url (e.g. from a request), or an empty string for
 * the fallback icon. Looks the site up in the app catalog the same way the wallet does - by its own
 * hostname or by its root domain - as catalog apps can show their icon from anywhere.
 */
const useLoadableDappIcon = ({
  icon,
  siteUrl
}: {
  icon?: string | null
  siteUrl?: string | null
}): string => {
  const { state: dapps } = useController('DappsController', selectDapps)

  return useMemo(() => {
    if (!icon || !siteUrl) return ''

    const siteId = getDappIdFromUrl(siteUrl)
    const siteRootDomain = getDomain(siteUrl)
    const isInAppCatalog = (dapps ?? []).some(
      (dapp) => !dapp.isCustom && (dapp.id === siteId || dapp.id === siteRootDomain)
    )

    return getLoadableDappIcon({ icon, siteUrl, isInAppCatalog })
  }, [icon, siteUrl, dapps])
}

export default useLoadableDappIcon
