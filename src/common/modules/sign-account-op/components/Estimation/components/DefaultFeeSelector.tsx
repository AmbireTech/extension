import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { SignAccountOpFeeTokenPreference } from '@ambire-common/controllers/signAccountOp/signAccountOp'
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
    feeTokenPreferenceChainId && signAccountOpState?.feeTokenPreference
      ? signAccountOpState.feeTokenPreference.erc20ByChainId[feeTokenPreferenceChainId]
      : undefined

  const pendingFeeTokenPreference =
    feeTokenPreferenceChainId && signAccountOpState?.pendingFeeTokenPreference
      ? signAccountOpState.pendingFeeTokenPreference.erc20ByChainId[feeTokenPreferenceChainId]
      : undefined

  const doesFeeTokenPreferenceMatchPayValue = useCallback(
    (
      preference: SignAccountOpFeeTokenPreference | undefined | null,
      erc20Preference: typeof selectedFeeTokenPreference
    ) => {
      if (!payValue || !preference) return false

      if (payValue.token.flags.onGasTank) {
        return !!preference.preferGasTank && !erc20Preference
      }

      if (payValue.token.address === ZERO_ADDRESS) {
        return !preference.preferGasTank && !erc20Preference
      }

      return (
        !!erc20Preference &&
        payValue.token.address.toLowerCase() === erc20Preference.address.toLowerCase() &&
        payValue.token.symbol.toLowerCase() === erc20Preference.symbol.toLowerCase()
      )
    },
    [payValue]
  )

  const isPersistedDefaultFeeOptionSelected = useMemo(() => {
    return doesFeeTokenPreferenceMatchPayValue(
      signAccountOpState?.feeTokenPreference,
      selectedFeeTokenPreference
    )
  }, [
    doesFeeTokenPreferenceMatchPayValue,
    selectedFeeTokenPreference,
    signAccountOpState?.feeTokenPreference
  ])

  const shouldShowDefaultFeeOptionCheckbox = useMemo(() => {
    if (!payValue || payValue.disabled || !signAccountOpState) return false
    if (payValue.paidBy !== signAccountOpState.accountOp.accountAddr) return false
    if (!hasManyPayOptionsByUsOrGasTank) return false
    return !isPersistedDefaultFeeOptionSelected
  }, [isPersistedDefaultFeeOptionSelected, payValue, signAccountOpState])

  const isDefaultFeeOptionSelected = useMemo(() => {
    if (!payValue || !signAccountOpState) return false

    return doesFeeTokenPreferenceMatchPayValue(
      signAccountOpState.pendingFeeTokenPreference,
      pendingFeeTokenPreference
    )
  }, [doesFeeTokenPreferenceMatchPayValue, payValue, pendingFeeTokenPreference, signAccountOpState])

  const defaultFeeOptionCheckboxLabel = useMemo(() => {
    if (!payValue?.token.flags.onGasTank && payValue?.token.address !== ZERO_ADDRESS) {
      return t('Do you want to set this as a default option for {{network}}?', {
        network: networkName || t('this network')
      })
    }

    return t('Do you want to set this as a default option?')
  }, [networkName, payValue?.token.address, payValue?.token.flags.onGasTank, t])

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
