import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import HelpIcon from '@common/assets/svg/HelpIcon'
import ControlOption from '@common/components/ControlOption'
import FatToggle from '@common/components/FatToggle'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useFeatureFlagsControllerState from '@web/hooks/useFeatureFlagsControllerState'

const DefiPositionsControlOption = () => {
  const { dispatch } = useBackgroundService()
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { flags } = useFeatureFlagsControllerState()

  const handleToggle = useCallback(() => {
    dispatch({
      type: 'FEATURE_FLAGS_CONTROLLER_FLIP_FEATURE',
      params: {
        flag: 'defiPositions',
        isEnabled: !flags.defiPositions
      }
    })
  }, [dispatch, flags.defiPositions])

  return (
    <ControlOption
      style={spacings.mbTy}
      title={t('Defi positions')}
      description={t('Should we fetch your defi positions.')}
      renderIcon={<HelpIcon color={theme.primaryText} />}
    >
      <FatToggle isOn={flags.defiPositions} onToggle={handleToggle} />
    </ControlOption>
  )
}

export default React.memo(DefiPositionsControlOption)
