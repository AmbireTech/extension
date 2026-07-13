import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { ISignAccountOpController } from '@ambire-common/interfaces/signAccountOp'
import { ZERO_ADDRESS } from '@ambire-common/services/socket/constants'
import Checkbox from '@common/components/Checkbox'
import { SelectValue } from '@common/components/Select/types'
import useController from '@common/hooks/useController'
import spacings from '@common/styles/spacings'

import { Props as EstimationProps } from '../types'

type Props = {
  networkName?: string
  payValue?: SelectValue
  signAccountOpState: ISignAccountOpController | null
  updateType: EstimationProps['updateType']
  hasManyPayOptionsByUsOrGasTank: boolean
}

const DefaultFeeSelector = ({
  networkName,
  payValue,
  signAccountOpState,
  updateType,
  hasManyPayOptionsByUsOrGasTank
}: Props) => {
  const { dispatch: signAccountOpDispatch } = useController('SignAccountOpController')
  const { dispatch: swapAndBridgeDispatch } = useController('SwapAndBridgeController')
  const { dispatch: transferDispatch } = useController('TransferController')
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

  const shouldShowDefaultFeeOptionCheckbox = useMemo(() => {
    if (!payValue || !hasManyPayOptionsByUsOrGasTank) return false
    return !isPersistedDefaultFeeOptionSelected
  }, [isPersistedDefaultFeeOptionSelected, hasManyPayOptionsByUsOrGasTank, payValue])

  const isDefaultFeeOptionSelected = useMemo(() => {
    if (!payValue || !signAccountOpState) return false

    return doesFeeTokenPreferenceMatchPayValue(pendingFeeTokenPreference)
  }, [doesFeeTokenPreferenceMatchPayValue, payValue, pendingFeeTokenPreference, signAccountOpState])

  const defaultFeeOptionCheckboxLabel = useMemo(() => {
    return t('Set this as a default option for {{network}}?', {
      network: networkName || t('this network')
    })
  }, [networkName, t])

  const onSetDefaultFeeOption = useCallback(
    (enabled: boolean) => {
      if (!payValue?.token && enabled) return

      const feeToken = enabled && payValue?.token ? payValue.token : null
      const update = { pendingFeeTokenPreference: feeToken }

      const args: ['update', [typeof update]] = ['update', [update]]

      if (updateType === 'Swap&Bridge') {
        swapAndBridgeDispatch({
          type: 'method',
          params: {
            method: 'callSignAccountOpMethod',
            args
          }
        })
      } else if (updateType === 'Transfer&TopUp') {
        transferDispatch({
          type: 'method',
          params: {
            method: 'callSignAccountOpMethod',
            args
          }
        })
      } else {
        signAccountOpDispatch({
          type: 'method',
          params: {
            method: 'update',
            args: [update]
          }
        })
      }
    },
    [payValue?.token, signAccountOpDispatch, swapAndBridgeDispatch, transferDispatch, updateType]
  )

  if (!shouldShowDefaultFeeOptionCheckbox) return null

  return (
    <Checkbox
      value={isDefaultFeeOptionSelected}
      style={[spacings.mt, spacings.mb0]}
      onValueChange={onSetDefaultFeeOption}
      label={defaultFeeOptionCheckboxLabel}
      labelProps={{ fontSize: 14 }}
      testID="default-fee-option-checkbox"
    />
  )
}

export default React.memo(DefaultFeeSelector)
