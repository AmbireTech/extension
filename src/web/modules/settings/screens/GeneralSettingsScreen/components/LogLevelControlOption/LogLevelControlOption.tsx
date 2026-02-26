import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import DevIcon from '@common/assets/svg/DevIcon/DevIcon'
import ControlOption from '@common/components/ControlOption'
import FatToggle from '@common/components/FatToggle'
import useController from '@common/hooks/useController'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { LOG_LEVELS } from '@web/utils/logger'

const LogLevelControlOption = () => {
  const { t } = useTranslation()
  const {
    state: { logLevel },
    dispatch: walletStateDispatch
  } = useController('WalletStateController')

  const handleToggleLogLevel = useCallback(() => {
    const nextLogLevel = logLevel === LOG_LEVELS.DEV ? LOG_LEVELS.PROD : LOG_LEVELS.DEV

    walletStateDispatch({
      type: 'method',
      params: {
        method: 'setLogLevel',
        args: [nextLogLevel]
      }
    })
  }, [walletStateDispatch, logLevel])

  return (
    <ControlOption
      style={spacings.mbTy}
      title={t('Development logs')}
      description={t('Expose technical details in your browser console only, never shared.')}
      renderIcon={<DevIcon />}
    >
      <FatToggle isOn={logLevel === LOG_LEVELS.DEV} onToggle={handleToggleLogLevel} />
    </ControlOption>
  )
}

export default React.memo(LogLevelControlOption)
