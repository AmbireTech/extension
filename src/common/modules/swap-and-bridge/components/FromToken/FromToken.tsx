import React, { FC, memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { TokenResult } from '@ambire-common/libs/portfolio'
import { SelectValue } from '@common/components/Select/types'
import SendToken from '@common/components/SendToken'
import useController from '@common/hooks/useController'
import useSwapAndBridgeForm from '@common/modules/swap-and-bridge/hooks/useSwapAndBridgeForm'
import { getTokenId } from '@common/utils/token'

type Props = Pick<
  ReturnType<typeof useSwapAndBridgeForm>,
  | 'fromTokenOptions'
  | 'fromTokenValue'
  | 'fromAmountValue'
  | 'fromTokenAmountSelectDisabled'
  | 'onFromAmountChange'
> & { simulationFailed?: boolean }

const FromToken: FC<Props> = ({
  fromTokenOptions,
  fromTokenValue,
  fromAmountValue,
  fromTokenAmountSelectDisabled,
  onFromAmountChange,
  simulationFailed
}) => {
  const { dispatch: swapAndBridgeDispatch } = useController('SwapAndBridgeController')
  const { t } = useTranslation()

  const {
    fromSelectedToken,
    toSelectedToken,
    fromAmount,
    fromAmountInFiat,
    portfolioTokenList,
    fromAmountFieldMode,
    maxFromAmount,
    validateFromAmount
  } = useController('SwapAndBridgeController').state

  const handleChangeFromToken = useCallback(
    ({ value }: SelectValue) => {
      const tokenToSelect = portfolioTokenList.find(
        (tokenRes: TokenResult) => getTokenId(tokenRes) === value
      )

      // Switch the tokens if the selected token is the same as the "to" token
      if (
        tokenToSelect &&
        toSelectedToken &&
        tokenToSelect.address === toSelectedToken.address &&
        tokenToSelect.chainId === BigInt(toSelectedToken.chainId || 0)
      ) {
        swapAndBridgeDispatch({
          type: 'method',
          params: { method: 'switchFromAndToTokens', args: [] }
        })
        return
      }

      swapAndBridgeDispatch({
        type: 'method',
        params: { method: 'updateForm', args: [{ fromSelectedToken: tokenToSelect }, undefined] }
      })
    },
    [portfolioTokenList, toSelectedToken, swapAndBridgeDispatch]
  )

  const handleSetMaxFromAmount = useCallback(() => {
    swapAndBridgeDispatch({
      type: 'method',
      params: { method: 'updateForm', args: [{ shouldSetMaxAmount: true }, undefined] }
    })
  }, [swapAndBridgeDispatch])

  const handleSwitchFromAmountFieldMode = useCallback(() => {
    swapAndBridgeDispatch({
      type: 'method',
      params: {
        method: 'updateForm',
        args: [
          { fromAmountFieldMode: fromAmountFieldMode === 'token' ? 'fiat' : 'token' },
          undefined
        ]
      }
    })
  }, [fromAmountFieldMode, swapAndBridgeDispatch])

  return (
    <SendToken
      label={t('You send')}
      fromTokenOptions={fromTokenOptions}
      fromTokenValue={fromTokenValue}
      fromAmountValue={fromAmountValue}
      fromTokenAmountSelectDisabled={fromTokenAmountSelectDisabled}
      handleChangeFromToken={handleChangeFromToken}
      fromSelectedToken={fromSelectedToken}
      fromAmount={fromAmount}
      fromAmountInFiat={fromAmountInFiat}
      fromAmountFieldMode={fromAmountFieldMode}
      maxFromAmount={maxFromAmount}
      validateFromAmount={validateFromAmount}
      onFromAmountChange={onFromAmountChange}
      handleSwitchFromAmountFieldMode={handleSwitchFromAmountFieldMode}
      handleSetMaxFromAmount={handleSetMaxFromAmount}
      inputTestId="from-amount-input-sab"
      selectTestId="from-token-select"
      simulationFailed={simulationFailed}
    />
  )
}

export default memo(FromToken)
