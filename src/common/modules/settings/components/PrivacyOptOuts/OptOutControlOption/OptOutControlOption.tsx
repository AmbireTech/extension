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
    const isEnabling = !flags[flag]
    let nextFlags: Partial<FeatureFlags> = { [flag]: isEnabling }

    if (flag === 'gasTank' && isEnabling) {
      nextFlags = { gasTank: true, erc4337: true, tokenPrices: true }
    }

    if (flag === 'erc4337' && !isEnabling) {
      nextFlags = { erc4337: false, gasTank: false }
    }

    if (flag === 'tokenPrices' && !isEnabling) {
      nextFlags = { tokenPrices: false, erc4337: false, gasTank: false }
    }

    featureFlagsDispatch({
      type: 'method',
      params: {
        method: 'setFeatureFlags',
        args: [nextFlags]
      }
    })
  }, [featureFlagsDispatch, flags, flag])

  return (
    <ControlOption
      style={spacings.mbTy}
      title={title}
      description={description}
      forceDescriptionOnMobile
      renderIcon={icon}
    >
      <FatToggle isOn={flags[flag]} onToggle={handleToggle} trackStyle={spacings.mr0} />
    </ControlOption>
  )
}

export default React.memo(OptOutControlOption)
