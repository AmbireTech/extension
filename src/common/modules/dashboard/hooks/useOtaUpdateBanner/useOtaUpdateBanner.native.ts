import { useMemo } from 'react'
import { useStallionUpdate } from 'react-native-stallion'

import { Banner } from '@ambire-common/interfaces/banner'
import { useTranslation } from '@common/config/localization'

const OTA_BANNER_ID = 'ota-update-available'

// Renders via the controllerBanners path (DashboardBanner + 'apply-ota-update' action),
// same as the extension's update banner - NOT BannerController.addBanner, which is the
// marketing path (no action button, dismiss-forever, account gating).
const useOtaUpdateBanner = (): Banner[] => {
  const { t } = useTranslation()
  const { isRestartRequired } = useStallionUpdate()

  return useMemo(() => {
    if (!isRestartRequired) return []

    return [
      {
        id: OTA_BANNER_ID,
        type: 'info',
        title: t('Update Available'),
        text: t(
          'A new version is ready! It will be applied on the next app restart. Restart now to update immediately.'
        ),
        actions: [{ actionName: 'apply-ota-update', label: t('Restart') }]
      }
    ]
  }, [isRestartRequired, t])
}

export default useOtaUpdateBanner
