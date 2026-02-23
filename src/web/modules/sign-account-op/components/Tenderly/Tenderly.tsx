import { Interface } from 'ethers'
import { setStringAsync } from 'expo-clipboard'
import React, { useCallback, useMemo } from 'react'
import { View } from 'react-native'

import AmbireAccount from '@ambire-common/../contracts/compiled/AmbireAccount.json'
import AmbireFactory from '@ambire-common/../contracts/compiled/AmbireFactory.json'
import { DEPLOYLESS_SIMULATION_FROM } from '@ambire-common/consts/deploy'
import { EstimationStatus } from '@ambire-common/controllers/estimation/types'
import { getSpoof } from '@ambire-common/libs/account/account'
import { getSignableCalls } from '@ambire-common/libs/accountOp/accountOp'
import Button from '@common/components/Button'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

const Tenderly = () => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { state: signAccountOpState } = useController('SignAccountOpController')
  const { state: accountsState } = useController('AccountsController')
  const { accountStates } = accountsState

  const state = useMemo(() => {
    if (!signAccountOpState) return undefined
    return accountStates[signAccountOpState.accountOp.accountAddr]?.[
      signAccountOpState.accountOp.chainId.toString()
    ]
  }, [signAccountOpState, accountStates])

  const estimationUsesStateOverrides = useMemo(() => {
    if (!signAccountOpState || !state) return false

    return state.isEOA && !state.isSmarterEoa && signAccountOpState.accountOp.calls.length > 1
  }, [signAccountOpState, state])

  const openTenderly = useCallback(async () => {
    if (
      !signAccountOpState ||
      !signAccountOpState.accountOp.calls.length ||
      !state ||
      estimationUsesStateOverrides
    )
      return

    let params

    if (signAccountOpState.account.creation || state.isSmarterEoa) {
      if (signAccountOpState.account.creation && !state.isDeployed) {
        const ambireFactory = new Interface(AmbireFactory.abi)
        const executeData = ambireFactory.encodeFunctionData('deployAndExecute', [
          signAccountOpState.account.creation.bytecode,
          signAccountOpState.account.creation.salt,
          getSignableCalls(signAccountOpState.accountOp),
          getSpoof(signAccountOpState.account)
        ])
        params = new URLSearchParams({
          network: signAccountOpState.accountOp.chainId.toString(),
          from: DEPLOYLESS_SIMULATION_FROM,
          contractAddress: signAccountOpState.account.creation.factoryAddr,
          rawFunctionInput: executeData,
          value: '0'
        })
      } else {
        const ambireAccount = new Interface(AmbireAccount.abi)
        const executeData = ambireAccount.encodeFunctionData('execute', [
          getSignableCalls(signAccountOpState.accountOp),
          getSpoof(signAccountOpState.account)
        ])
        params = new URLSearchParams({
          network: signAccountOpState.accountOp.chainId.toString(),
          from: DEPLOYLESS_SIMULATION_FROM,
          contractAddress: signAccountOpState.accountOp.accountAddr,
          rawFunctionInput: executeData,
          value: '0'
        })
      }
    } else {
      // only a single call for EOAs
      const call = signAccountOpState.accountOp.calls[0]!
      params = new URLSearchParams({
        network: signAccountOpState.accountOp.chainId.toString(),
        from: signAccountOpState.accountOp.accountAddr,
        contractAddress: call.to,
        rawFunctionInput: call.data,
        value: call.value.toString()
      })
    }

    const base = 'https://dashboard.tenderly.co/simulator/new'
    const tenderlyLink = `${base}?${params.toString()}`
    try {
      await setStringAsync(tenderlyLink)
      addToast('Copied to clipboard!')
    } catch {
      addToast('Failed to copy to clipboard', { type: 'error' })
    }
  }, [signAccountOpState, addToast, estimationUsesStateOverrides, state])

  // no tenderly link if state overrides are required for estimating
  // as tenderly doesn't support links through state override
  // also, show this only on Error
  if (
    estimationUsesStateOverrides ||
    signAccountOpState?.estimation.status !== EstimationStatus.Error
  )
    return null

  return (
    <View style={[flexbox.directionRow, flexbox.justifyCenter, spacings.mt]}>
      <Button
        type="secondary"
        text={t('Copy developer information')}
        onPress={openTenderly}
        hasBottomSpacing={false}
        size="large"
      />
    </View>
  )
}

export default Tenderly
