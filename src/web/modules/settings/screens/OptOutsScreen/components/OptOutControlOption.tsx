import React, { useCallback } from 'react'

import { FeatureFlags } from '@ambire-common/consts/featureFlags'
import ControlOption from '@common/components/ControlOption'
import FatToggle from '@common/components/FatToggle'
import useController from '@common/hooks/useController'
import spacings from '@common/styles/spacings'

interface Opts {
  title: string
  description: string
  icon: React.ReactNode
  flag: keyof FeatureFlags
}

const OptOutControlOption = (opts: Opts) => {
  const {
    state: { flags },
    dispatch: featureFlagsDispatch
  } = useController('FeatureFlagsController')
  const { title, description, icon, flag } = opts

  const handleToggle = useCallback(() => {
    featureFlagsDispatch({
      type: 'method',
      params: {
        method: 'setFeatureFlag',
        args: [flag, !flags[flag]]
      }
    })
  }, [featureFlagsDispatch, flags, flag])

  return (
    <ControlOption style={spacings.mbTy} title={title} description={description} renderIcon={icon}>
      <FatToggle isOn={flags[flag]} onToggle={handleToggle} />
    </ControlOption>
  )
}

export default React.memo(OptOutControlOption)
