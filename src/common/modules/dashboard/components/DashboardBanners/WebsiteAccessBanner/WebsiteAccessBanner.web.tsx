import React, { useCallback } from 'react'

import Banner from '@common/components/Banner'
import { useTranslation } from '@common/config/localization'
import useToast from '@common/hooks/useToast'
import useWebsiteAccess from '@web/hooks/useWebsiteAccess'

/**
 * Shown when the user has turned off the extension's access to websites (Firefox and Chromium browsers),
 * which silently hides the wallet from every app. Can't be dismissed - nothing works without it.
 */
const WebsiteAccessBanner = () => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { hasWebsiteAccess, requestWebsiteAccess } = useWebsiteAccess()

  const handleAllowAccessPress = useCallback(async () => {
    const isGranted = await requestWebsiteAccess()
    if (!isGranted) return

    addToast(t('Website access is on. Reload any open app pages to connect to them.'), {
      type: 'success'
    })
  }, [requestWebsiteAccess, addToast, t])

  if (hasWebsiteAccess !== false) return null

  return (
    <Banner
      type="warning"
      title={t("Apps can't find your wallet")}
      text={t(
        'Ambire is not allowed to access websites, so apps can’t connect to it. Allow access to use your wallet with apps.'
      )}
      buttonText={t('Allow access')}
      onPress={handleAllowAccessPress}
    />
  )
}

export default React.memo(WebsiteAccessBanner)
