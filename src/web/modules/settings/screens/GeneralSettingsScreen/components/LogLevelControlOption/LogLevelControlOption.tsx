import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import DevIcon from '@common/assets/svg/DevIcon/DevIcon'
import ControlOption from '@common/components/ControlOption'
import FatToggle from '@common/components/FatToggle'
import Toggle from '@common/components/Toggle'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import ThemeToggle from '@web/components/ThemeToggle'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useWalletStateController from '@web/hooks/useWalletStateController'
import { LOG_LEVELS } from '@web/utils/logger'

const LogLevelControlOption = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { logLevel } = useWalletStateController()
  const { dispatch } = useBackgroundService()

  const handleToggleLogLevel = useCallback(() => {
    const nextLogLevel = logLevel === LOG_LEVELS.DEV ? LOG_LEVELS.PROD : LOG_LEVELS.DEV

    dispatch({ type: 'SET_LOG_LEVEL', params: { logLevel: nextLogLevel } })
  }, [dispatch, logLevel])

  return (
    <ControlOption
      style={spacings.mbTy}
      title={t('Development logs')}
      description={t('Expose technical details in your browser console only, never shared.')}
      renderIcon={<DevIcon color={theme.primaryText} />}
    >
      <FatToggle isOn={logLevel === LOG_LEVELS.DEV} onToggle={handleToggleLogLevel} />
    </ControlOption>
  )
}

export default React.memo(LogLevelControlOption)
