import { useMemo } from 'react'
import { useStallionUpdate } from 'react-native-stallion'

import { Banner } from '@ambire-common/interfaces/banner'
import { useTranslation } from '@common/config/localization'

const OTA_BANNER_ID = 'ota-update-available'

// Returns the Stallion OTA "update ready" banner for useBanners to render in the shared
// dashboard banner list via the NON-marketing controllerBanners path - the same path the
// browser-extension update banner uses (rendered by DashboardBanner, which has the
// 'apply-ota-update' action handling).
//
// NOT BannerController.addBanner: that is the MARKETING path (MarketingBanner renderer with
// no action button + dismiss-forever persistence + account gating), which is wrong here.
//
// Stallion is a native module + React hook, so this is the .native variant; the .web one
// returns [] (no OTA on web). The Restart action is handled in DashboardBanner via the
// .native applyOtaUpdate helper, which calls Stallion's restart() on the RN main thread.
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
