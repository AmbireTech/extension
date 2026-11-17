import React, { useCallback, useMemo } from 'react'

import LinkIcon from '@common/assets/svg/LinkIcon'
import LockIcon from '@common/assets/svg/LockIcon'
import Badge from '@common/components/Badge'
import Button from '@common/components/Button'
import ControlOption from '@common/components/ControlOption'
import FatToggle from '@common/components/FatToggle'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'

import getFeatureFlagUpdates from './getFeatureFlagUpdates'

import type { FeatureFlags } from '@ambire-common/consts/featureFlags'
import type { IFeatureFlagsController } from '@ambire-common/interfaces/featureFlags'

const selectFeatureFlags = (state: IFeatureFlagsController) => state.flags

interface RequiredBy {
  flag: keyof FeatureFlags
  title: string
}

/**
 * Shown in place of the toggle when the option can't be changed from here, for example
 * when something has to be turned off on another screen first
 */
interface Action {
  text: string
  onPress: () => void
}

interface Opts {
  title: string
  description: string
  icon: React.ReactNode
  flag: keyof FeatureFlags
  requiredBy?: RequiredBy
  action?: Action
}

const OptOutControlOption = (opts: Opts) => {
  const { state: flags, dispatch: featureFlagsDispatch } = useController(
    'FeatureFlagsController',
    selectFeatureFlags
  )
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { title, description, icon, flag, requiredBy, action } = opts
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
      {action ? (
        <Button
          type="success"
          size="smaller"
          style={spacings.phLg}
          text={action.text}
          onPress={action.onPress}
          hasBottomSpacing={false}
        />
      ) : (
        <FatToggle
          isOn={flags[flag]}
          onToggle={handleToggle}
          disabled={isRequired}
          trackStyle={spacings.mr0}
        >
          {isRequired && <LockIcon width={14} height={14} color={theme.primaryAccent300} />}
        </FatToggle>
      )}
    </ControlOption>
  )
}

export default React.memo(OptOutControlOption)
