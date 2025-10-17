import React, { FC, memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { TokenResult } from '@ambire-common/libs/portfolio'
import { SelectValue } from '@common/components/Select/types'
import SendToken from '@common/components/SendToken'
import Text from '@common/components/Text'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useSwapAndBridgeControllerState from '@web/hooks/useSwapAndBridgeControllerState'
import useSwapAndBridgeForm from '@web/modules/swap-and-bridge/hooks/useSwapAndBridgeForm'
import { getTokenId } from '@web/utils/token'

type Props = Pick<
  ReturnType<typeof useSwapAndBridgeForm>,
  | 'fromTokenOptions'
  | 'fromTokenValue'
  | 'fromAmountValue'
  | 'fromTokenAmountSelectDisabled'
  | 'onFromAmountChange'
  | 'setIsAutoSelectRouteDisabled'
> & { simulationFailed?: boolean }

const FromToken: FC<Props> = ({
  fromTokenOptions,
  fromTokenValue,
  fromAmountValue,
  fromTokenAmountSelectDisabled,
  setIsAutoSelectRouteDisabled,
  onFromAmountChange,
  simulationFailed
}) => {
  const { dispatch } = useBackgroundService()
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
  } = useSwapAndBridgeControllerState()

  const handleChangeFromToken = useCallback(
    ({ value }: SelectValue) => {
      const tokenToSelect = portfolioTokenList.find(
        (tokenRes: TokenResult) => getTokenId(tokenRes) === value
      )

      setIsAutoSelectRouteDisabled(false)

      // Switch the tokens if the selected token is the same as the "to" token
      if (
        tokenToSelect &&
        toSelectedToken &&
        tokenToSelect.address === toSelectedToken.address &&
        tokenToSelect.chainId === BigInt(toSelectedToken.chainId || 0)
      ) {
        dispatch({
          type: 'SWAP_AND_BRIDGE_CONTROLLER_SWITCH_FROM_AND_TO_TOKENS'
        })
        return
      }

      dispatch({
        type: 'SWAP_AND_BRIDGE_CONTROLLER_UPDATE_FORM',
        params: { formValues: { fromSelectedToken: tokenToSelect } }
      })
    },
    [portfolioTokenList, setIsAutoSelectRouteDisabled, toSelectedToken, dispatch]
  )

  const handleSetMaxFromAmount = useCallback(() => {
    dispatch({
      type: 'SWAP_AND_BRIDGE_CONTROLLER_UPDATE_FORM',
      params: { formValues: { shouldSetMaxAmount: true } }
    })
  }, [dispatch])

  const handleSwitchFromAmountFieldMode = useCallback(() => {
    dispatch({
      type: 'SWAP_AND_BRIDGE_CONTROLLER_UPDATE_FORM',
      params: {
        formValues: { fromAmountFieldMode: fromAmountFieldMode === 'token' ? 'fiat' : 'token' }
      }
    })
  }, [fromAmountFieldMode, dispatch])

  return (
    <>
      <Text appearance="secondaryText" fontSize={16} weight="medium">
        {t('Send')}
      </Text>
      <SendToken
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
    </>
  )
}

export default memo(FromToken)
