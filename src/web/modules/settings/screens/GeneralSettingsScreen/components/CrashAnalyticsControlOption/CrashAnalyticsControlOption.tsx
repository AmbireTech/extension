import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import DevIcon from '@common/assets/svg/DevIcon/DevIcon'
import ControlOption from '@common/components/ControlOption'
import FatToggle from '@common/components/FatToggle'
import useController from '@common/hooks/useController'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'

const CrashAnalyticsControlOption = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { crashAnalyticsEnabled } = useController('WalletStateController').state
  const { dispatch } = useControllersMiddleware()

  const handleToggleCrashAnalytics = useCallback(() => {
    dispatch({
      type: 'SET_CRASH_ANALYTICS',
      params: { enabled: !crashAnalyticsEnabled }
    })
  }, [dispatch, crashAnalyticsEnabled])

  return (
    <ControlOption
      style={spacings.mbTy}
      title={t('Crash analytics')}
      description={t(
        'Help us fix issues faster with anonymous error reports, no personal identifiable info collected.'
      )}
      renderIcon={<DevIcon color={theme.primaryText} />}
    >
      <FatToggle isOn={crashAnalyticsEnabled} onToggle={handleToggleCrashAnalytics} />
    </ControlOption>
  )
}

export default React.memo(CrashAnalyticsControlOption)
