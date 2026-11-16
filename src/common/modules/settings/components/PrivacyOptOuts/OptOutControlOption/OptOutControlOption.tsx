import React, { useCallback, useMemo } from 'react'
import { useModalize } from 'react-native-modalize'

import LinkIcon from '@common/assets/svg/LinkIcon'
import LockIcon from '@common/assets/svg/LockIcon'
import Badge from '@common/components/Badge'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import ControlOption from '@common/components/ControlOption'
import DualChoiceWarningModal from '@common/components/DualChoiceWarningModal'
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

/** Asked before turning the option off, for when that has consequences the user should know */
interface DisableConfirmation {
  title: string
  text: string
}

interface Opts {
  title: string
  description: string
  icon: React.ReactNode
  flag: keyof FeatureFlags
  requiredBy?: RequiredBy
  action?: Action
  disableConfirmation?: DisableConfirmation
}

const OptOutControlOption = (opts: Opts) => {
  const { state: flags, dispatch: featureFlagsDispatch } = useController(
    'FeatureFlagsController',
    selectFeatureFlags
  )
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { title, description, icon, flag, requiredBy, action, disableConfirmation } = opts
  const isRequired = !!requiredBy && flags[flag] && flags[requiredBy.flag]
  const { ref: sheetRef, open: openSheet, close: closeSheet } = useModalize()

  const setEnabled = useCallback(
    (isEnabling: boolean) => {
      featureFlagsDispatch({
        type: 'method',
        params: {
          method: 'setFeatureFlags',
          args: [getFeatureFlagUpdates(flag, isEnabling)]
        }
      })
    },
    [featureFlagsDispatch, flag]
  )

  const handleToggle = useCallback(() => {
    const isEnabling = !flags[flag]
    if (!isEnabling && disableConfirmation) {
      openSheet()
      return
    }

    setEnabled(isEnabling)
  }, [flags, flag, disableConfirmation, openSheet, setEnabled])

  const handleConfirmDisable = useCallback(() => {
    setEnabled(false)
    closeSheet()
  }, [setEnabled, closeSheet])

  const handleCancelDisable = useCallback(() => closeSheet(), [closeSheet])

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
    <>
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
      {!!disableConfirmation && (
        <BottomSheet
          id={`opt-out-${flag}-confirmation`}
          sheetRef={sheetRef}
          closeBottomSheet={closeSheet}
          type="modal"
        >
          <DualChoiceWarningModal
            title={disableConfirmation.title}
            description={disableConfirmation.text}
            primaryButtonText={t('Turn off')}
            secondaryButtonText={t('Cancel')}
            onPrimaryButtonPress={handleConfirmDisable}
            onSecondaryButtonPress={handleCancelDisable}
          />
        </BottomSheet>
      )}
    </>
  )
}

export default React.memo(OptOutControlOption)
