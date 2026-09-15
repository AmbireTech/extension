import React, { useCallback, useMemo } from 'react'

import LinkIcon from '@common/assets/svg/LinkIcon'
import LockIcon from '@common/assets/svg/LockIcon'
import Badge from '@common/components/Badge'
import ControlOption from '@common/components/ControlOption'
import FatToggle from '@common/components/FatToggle'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'

import getFeatureFlagUpdates from './getFeatureFlagUpdates'

import type { FeatureFlags } from '@ambire-common/consts/featureFlags'
import type { FeatureFlagsController } from '@ambire-common/controllers/featureFlags/featureFlags'

const selectFeatureFlags = (state: FeatureFlagsController) => state.flags

interface RequiredBy {
  flag: keyof FeatureFlags
  title: string
}

interface Opts {
  title: string
  description: string
  icon: React.ReactNode
  flag: keyof FeatureFlags
  requiredBy?: RequiredBy
}

const OptOutControlOption = (opts: Opts) => {
  const { state: flags, dispatch: featureFlagsDispatch } = useController(
    'FeatureFlagsController',
    selectFeatureFlags
  )
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { title, description, icon, flag, requiredBy } = opts
  const isRequired = !!requiredBy && flags[flag] && flags[requiredBy.flag]

  const handleToggle = useCallback(() => {
    const isEnabling = !flags[flag]

    featureFlagsDispatch({
      type: 'method',
      params: {
        method: 'setFeatureFlags',
        args: [getFeatureFlagUpdates(flag, isEnabling)]
      }
    })
  }, [featureFlagsDispatch, flags, flag])

  const titleAccessory = useMemo(() => {
    if (!isRequired || !requiredBy) return null

    return (
      <Badge
        text={t('Required by {{feature}}', { feature: requiredBy.title })}
        tooltipText={t('Turn off {{feature}} before changing this setting.', {
          feature: requiredBy.title
        })}
        type="primaryAccent"
        style={spacings.mlTy}
      >
        <LinkIcon width={14} height={14} color={theme.primaryAccent300} />
      </Badge>
    )
  }, [isRequired, requiredBy, t, theme.primaryAccent300])

  return (
    <ControlOption
      style={spacings.mbTy}
      title={title}
      titleAccessory={titleAccessory}
      description={description}
      forceDescriptionOnMobile
      renderIcon={icon}
    >
      <FatToggle
        isOn={flags[flag]}
        onToggle={handleToggle}
        disabled={isRequired}
        trackStyle={spacings.mr0}
      >
        {isRequired && <LockIcon width={14} height={14} color={theme.primaryAccent300} />}
      </FatToggle>
    </ControlOption>
  )
}

export default React.memo(OptOutControlOption)
