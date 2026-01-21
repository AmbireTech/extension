import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import HelpIcon from '@common/assets/svg/HelpIcon'
import ControlOption from '@common/components/ControlOption'
import Select from '@common/components/Select'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useFeatureFlagsControllerState from '@web/hooks/useFeatureFlagsControllerState'

const selectOptions = [
  {
    value: 1,
    label: 'Enabled'
  },
  {
    value: 0,
    label: 'Disabled'
  }
]

const DefiPositionsControlOption = () => {
  const { dispatch } = useBackgroundService()
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { flags } = useFeatureFlagsControllerState()

  const selectedOption = useMemo(() => {
    const isEnabled = flags.defiPositions ? 1 : 0
    return selectOptions.find((option) => option.value === isEnabled)
  }, [flags.defiPositions])

  return (
    <ControlOption
      style={spacings.mbTy}
      title={t('Defi positions')}
      description={t('Should we fetch your defi positions.')}
      renderIcon={<HelpIcon color={theme.primaryText} />}
    >
      <Select
        setValue={(option) => {
          dispatch({
            type: 'FEATURE_FLAGS_CONTROLLER_FLIP_FEATURE',
            params: {
              flag: 'defiPositions',
              isEnabled: option.value === 1 ? true : false
            }
          })
        }}
        withSearch={false}
        options={selectOptions}
        value={selectedOption}
        containerStyle={{
          width: 120,
          ...spacings.mb0
        }}
        size="sm"
      />
    </ControlOption>
  )
}

export default React.memo(DefiPositionsControlOption)
