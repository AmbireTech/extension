import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ViewProps } from 'react-native'

import { ISignAccountOpController } from '@ambire-common/interfaces/signAccountOp'
import { ZERO_ADDRESS } from '@ambire-common/services/socket/constants'
import Checkbox from '@common/components/Checkbox'
import { SelectValue } from '@common/components/Select/types'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import { DispatchUpdate } from '../types'

type Props = {
  networkName?: string
  payValue?: SelectValue
  signAccountOpState: ISignAccountOpController | null
  dispatchUpdate: DispatchUpdate
  hasManyPayOptionsByUsOrGasTank: boolean
  baselineFeeOption: SelectValue['value'] | null
  style?: ViewProps['style']
}

const DefaultFeeSelector = ({
  networkName,
  payValue,
  signAccountOpState,
  dispatchUpdate,
  hasManyPayOptionsByUsOrGasTank,
  baselineFeeOption,
  style
}: Props) => {
  const { t } = useTranslation()

  const feeTokenPreferenceChainId = signAccountOpState?.accountOp.chainId.toString()
  const selectedFeeTokenPreference =
    feeTokenPreferenceChainId && signAccountOpState?.feeTokenPreference[feeTokenPreferenceChainId]
      ? signAccountOpState.feeTokenPreference[feeTokenPreferenceChainId]
      : ZERO_ADDRESS // default is native

  const pendingFeeTokenPreference =
    feeTokenPreferenceChainId && signAccountOpState?.pendingFeeTokenPreference
      ? signAccountOpState.pendingFeeTokenPreference[feeTokenPreferenceChainId]
      : undefined

  const doesFeeTokenPreferenceMatchPayValue = useCallback(
    (tokenPreference: string | undefined) => {
      if (!payValue || !tokenPreference) return false

      const isGasTank = payValue.token.flags.onGasTank && tokenPreference === 'gasTank'
      const isSelectedToken =
        !payValue.token.flags.onGasTank &&
        payValue.token.address.toLowerCase() === tokenPreference.toLowerCase()

      return isGasTank || isSelectedToken
    },
    [payValue]
  )

  const isPersistedDefaultFeeOptionSelected = useMemo(() => {
    return doesFeeTokenPreferenceMatchPayValue(selectedFeeTokenPreference)
  }, [doesFeeTokenPreferenceMatchPayValue, selectedFeeTokenPreference])

  // Only offer to save a default while the selection differs from what was there
  // before the user touched it. Comparing against the stored preference alone is
  // not enough - it falls back to native, while the auto-selected option may be
  // the gas tank or an ERC-20 when native can't cover the fee
  const shouldShowDefaultFeeOptionCheckbox = useMemo(() => {
    if (!payValue || !hasManyPayOptionsByUsOrGasTank || !baselineFeeOption) return false
    if (payValue.value === baselineFeeOption) return false

    return !isPersistedDefaultFeeOptionSelected
  }, [
    isPersistedDefaultFeeOptionSelected,
    hasManyPayOptionsByUsOrGasTank,
    baselineFeeOption,
    payValue
  ])

  const isDefaultFeeOptionSelected = useMemo(() => {
    if (!payValue || !signAccountOpState) return false

    return doesFeeTokenPreferenceMatchPayValue(pendingFeeTokenPreference)
  }, [doesFeeTokenPreferenceMatchPayValue, payValue, pendingFeeTokenPreference, signAccountOpState])

  const defaultFeeOptionCheckboxLabel = useMemo(() => {
    return t('Set this as a default token for {{network}}?', {
      network: networkName || t('this network')
    })
  }, [networkName, t])

  const onSetDefaultFeeOption = useCallback(
    (enabled: boolean) => {
      if (!payValue?.token && enabled) return

      dispatchUpdate({
        pendingFeeTokenPreference: enabled && payValue?.token ? payValue.token : null
      })
    },
    [dispatchUpdate, payValue?.token]
  )

  if (!shouldShowDefaultFeeOptionCheckbox) return null

  return (
    <Checkbox
      value={isDefaultFeeOptionSelected}
      style={style || [spacings.mt, spacings.mb0, flexbox.alignSelfEnd]}
      onValueChange={onSetDefaultFeeOption}
      label={defaultFeeOptionCheckboxLabel}
      labelProps={{ fontSize: 14 }}
      testID="default-fee-option-checkbox"
    />
  )
}

export default React.memo(DefaultFeeSelector)
