import React, { useCallback } from 'react'
import { View } from 'react-native'

import { TokenResult } from '@ambire-common/libs/portfolio'
import Recipient from '@common/components/Recipient'
import SendToken from '@common/components/SendToken'
import SkeletonLoader from '@common/components/SkeletonLoader'
import { useTranslation } from '@common/config/localization'
import useAddressInput from '@common/hooks/useAddressInput'
import useController from '@common/hooks/useController'
import useGetTokenSelectProps from '@common/hooks/useGetTokenSelectProps'
import { getTokenId } from '@common/utils/token'
import useSimulationError from '@web/modules/portfolio/hooks/SimulationError/useSimulationError'

const SendForm = ({
  addressInputState,
  hasGasTank,
  amountErrorMessage,
  amountErrorSeverity,
  isRecipientAddressUnknown,
  isRecipientHumanizerKnownTokenOrSmartContract,
  amountFieldValue,
  setAmountFieldValue,
  addressStateFieldValue,
  setAddressStateFieldValue
}: {
  addressInputState: ReturnType<typeof useAddressInput>
  hasGasTank: boolean
  amountErrorMessage: string
  amountErrorSeverity?: 'error' | 'warning' | 'info'
  isRecipientAddressUnknown: boolean
  isRecipientHumanizerKnownTokenOrSmartContract: boolean
  amountFieldValue: string
  setAmountFieldValue: (value: string) => void
  addressStateFieldValue: string
  setAddressStateFieldValue: (value: string) => void
}) => {
  const { validation } = addressInputState
  const {
    state: {
      tokens,
      maxAmount,
      amountFieldMode,
      amountInFiat,
      selectedToken,
      isTopUp,
      addressState,
      amount: controllerAmount,
      areDefaultsSet
    },
    dispatch: transferDispatch
  } = useController('TransferController')
  const {
    state: { portfolio }
  } = useController('SelectedAccountController')

  const { t } = useTranslation()
  const { networks } = useController('NetworksController').state
  const amountIsError = amountErrorSeverity === 'error' && !!amountErrorMessage

  const {
    value: tokenSelectValue,
    options,
    amountSelectDisabled
  } = useGetTokenSelectProps({
    tokens,
    token: selectedToken ? getTokenId(selectedToken) : '',
    networks,
    isToToken: false
  })

  const { simulationError } = useSimulationError({ chainId: selectedToken?.chainId })

  const disableForm = (!hasGasTank && isTopUp) || !tokens.length

  const handleChangeToken = useCallback(
    (value: string) => {
      const tokenToSelect = tokens.find((tokenRes: TokenResult) => getTokenId(tokenRes) === value)
      transferDispatch({
        type: 'method',
        params: {
          method: 'update',
          args: [
            {
              selectedToken: tokenToSelect,
              amount: ''
            }
          ]
        }
      })
    },
    [tokens, transferDispatch]
  )

  const setMaxAmount = useCallback(() => {
    transferDispatch({
      type: 'method',
      params: {
        method: 'update',
        args: [
          {
            shouldSetMaxAmount: true
          }
        ]
      }
    })
  }, [transferDispatch])

  const switchAmountFieldMode = useCallback(() => {
    transferDispatch({
      type: 'method',
      params: {
        method: 'update',
        args: [
          {
            amountFieldMode: amountFieldMode === 'token' ? 'fiat' : 'token'
          }
        ]
      }
    })
  }, [amountFieldMode, transferDispatch])

  return (
    <>
      <View>
        {!isTopUp && (
          <Recipient
            disabled={disableForm}
            address={addressStateFieldValue}
            setAddress={setAddressStateFieldValue}
            validation={validation}
            ensAddress={addressState.ensAddress}
            addressValidationMsg={validation.message}
            isRecipientHumanizerKnownTokenOrSmartContract={
              isRecipientHumanizerKnownTokenOrSmartContract
            }
            isRecipientAddressUnknown={isRecipientAddressUnknown}
            isRecipientDomainResolving={addressState.isDomainResolving}
            selectedTokenSymbol={selectedToken?.symbol}
          />
        )}
      </View>

      {(!selectedToken && tokens.length) || !portfolio?.isReadyToVisualize || !areDefaultsSet ? (
        <SkeletonLoader width="100%" height={156} />
      ) : (
        <SendToken
          label={t('Send token')}
          fromTokenOptions={options}
          fromTokenValue={tokenSelectValue}
          fromAmountValue={amountFieldValue}
          fromTokenAmountSelectDisabled={disableForm || amountSelectDisabled}
          handleChangeFromToken={({ value }) => handleChangeToken(value as string)}
          fromSelectedToken={selectedToken}
          fromAmount={controllerAmount}
          fromAmountInFiat={amountInFiat}
          fromAmountFieldMode={amountFieldMode}
          maxFromAmount={maxAmount}
          validateFromAmount={{ success: !amountIsError, message: amountErrorMessage }}
          onFromAmountChange={setAmountFieldValue}
          handleSwitchFromAmountFieldMode={switchAmountFieldMode}
          handleSetMaxFromAmount={setMaxAmount}
          inputTestId="amount-field"
          selectTestId="tokens-select"
          simulationFailed={!!simulationError}
        />
      )}
    </>
  )
}

export default React.memo(SendForm)
