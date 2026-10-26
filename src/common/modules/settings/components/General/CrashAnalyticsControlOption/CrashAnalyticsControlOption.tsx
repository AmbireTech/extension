import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import DevIcon from '@common/assets/svg/DevIcon/DevIcon'
import ControlOption from '@common/components/ControlOption'
import FatToggle from '@common/components/FatToggle'
import { crashAnalyticsUnavailableReason } from '@common/config/analytics/CrashAnalytics'
import { isMobile } from '@common/config/env'
import { CRASH_ANALYTICS_UNAVAILABLE_REASON } from '@common/constants/crashAnalytics'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'

const CrashAnalyticsControlOption = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { addToast } = useToast()
  const {
    state: { crashAnalyticsEnabled },
    dispatch: walletStateDispatch
  } = useController('WalletStateController')

  const handleToggleCrashAnalytics = useCallback(() => {
    walletStateDispatch({
      type: 'method',
      params: {
        method: 'setCrashAnalytics',
        args: [!crashAnalyticsEnabled]
      }
    })

    if (!isMobile) return

    // Only developers get here, so the toast names what the build is missing
    if (crashAnalyticsUnavailableReason) {
      const unavailableMessage =
        crashAnalyticsUnavailableReason === CRASH_ANALYTICS_UNAVAILABLE_REASON.DEV_BUILD
          ? t('Crash reporting does not start in development builds.')
          : t('Crash reporting cannot start because SENTRY_DSN_MOBILE is not set.')
      addToast(unavailableMessage, { type: 'error' })
      return
    }

    // The mobile crash reporter only starts at launch
    if (!crashAnalyticsEnabled) {
      addToast(t('This setting will be reflected on the next app launch'), {
        type: 'info'
      })
    }
  }, [walletStateDispatch, crashAnalyticsEnabled, addToast, t])

  return (
    <ControlOption
      style={spacings.mbTy}
      title={t('Crash analytics')}
      description={t(
        'Help us fix issues faster with anonymous error reports, no personal identifiable info collected.'
      )}
      renderIcon={<DevIcon color={theme.iconPrimary} />}
    >
      <FatToggle
        isOn={crashAnalyticsEnabled}
        onToggle={handleToggleCrashAnalytics}
        trackStyle={spacings.mr0}
      />
    </ControlOption>
  )
}

export default React.memo(CrashAnalyticsControlOption)
