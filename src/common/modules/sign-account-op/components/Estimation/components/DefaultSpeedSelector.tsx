import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ViewProps } from 'react-native'

import { FeeSpeed, ISignAccountOpController } from '@ambire-common/interfaces/signAccountOp'
import Checkbox from '@common/components/Checkbox'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import { DispatchUpdate } from '../types'

type Props = {
  networkName?: string
  signAccountOpState: ISignAccountOpController | null
  dispatchUpdate: DispatchUpdate
  baselineFeeSpeed: FeeSpeed | null
  style?: ViewProps['style']
}

const DefaultSpeedSelector = ({
  networkName,
  signAccountOpState,
  dispatchUpdate,
  baselineFeeSpeed,
  style
}: Props) => {
  const { t } = useTranslation()

  const selectedFeeSpeed = signAccountOpState?.selectedFeeSpeed
  const chainId = signAccountOpState?.accountOp.chainId.toString()
  const persistedFeeSpeed =
    chainId && signAccountOpState?.feeSpeedPreference[chainId]
      ? signAccountOpState.feeSpeedPreference[chainId]
      : FeeSpeed.Fast

  // Only offer to save a default while the selection differs from what was there
  // before the user touched it. The stored preference alone is not enough - the
  // speed also falls back to Fast when the saved one is unavailable for the
  // chosen fee option, which is not a choice the user made
  const shouldShowDefaultSpeedCheckbox =
    !!baselineFeeSpeed &&
    !!selectedFeeSpeed &&
    selectedFeeSpeed !== baselineFeeSpeed &&
    selectedFeeSpeed !== persistedFeeSpeed

  const defaultSpeedCheckboxLabel = useMemo(() => {
    return t('Set this as a default speed for {{network}}?', {
      network: networkName || t('this network')
    })
  }, [networkName, t])

  const onSetDefaultSpeed = useCallback(
    (enabled: boolean) => {
      if (!selectedFeeSpeed) return

      dispatchUpdate({ pendingFeeSpeedPreference: enabled ? selectedFeeSpeed : null })
    },
    [dispatchUpdate, selectedFeeSpeed]
  )

  if (!shouldShowDefaultSpeedCheckbox) return null

  return (
    <Checkbox
      value={signAccountOpState?.pendingFeeSpeedPreference === selectedFeeSpeed}
      style={style || [spacings.mt, spacings.mb0, flexbox.alignSelfEnd]}
      onValueChange={onSetDefaultSpeed}
      label={defaultSpeedCheckboxLabel}
      labelProps={{ fontSize: 14 }}
      testID="default-fee-speed-checkbox"
    />
  )
}

export default React.memo(DefaultSpeedSelector)
