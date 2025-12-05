import React, { useCallback, useEffect, useMemo } from 'react'
import { View } from 'react-native'

import { TokenResult } from '@ambire-common/libs/portfolio'
import { getTokenAmount } from '@ambire-common/libs/portfolio/helpers'
import { PanelBackButton, PanelTitle } from '@common/components/Panel/Panel'
import Recipient from '@common/components/Recipient'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import SendToken from '@common/components/SendToken'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useAddressInput from '@common/hooks/useAddressInput'
import useGetTokenSelectProps from '@common/hooks/useGetTokenSelectProps'
import useRoute from '@common/hooks/useRoute'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { getInfoFromSearch } from '@web/contexts/transferControllerStateContext'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'
import useTransferControllerState from '@web/hooks/useTransferControllerState'
import useSimulationError from '@web/modules/portfolio/hooks/SimulationError/useSimulationError'
import { getTokenId } from '@web/utils/token'
import { getUiType } from '@web/utils/uiType'

import styles from './styles'

const isTab = getUiType().isTab
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
  setAddressStateFieldValue,
  handleGoBack
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
  handleGoBack: () => void
}) => {
  const { validation } = addressInputState
  const { state, tokens } = useTransferControllerState()
  const { dispatch } = useBackgroundService()
  const { portfolio } = useSelectedAccountControllerState()
  const {
    maxAmount,
    amountFieldMode,
    amountInFiat,
    selectedToken,
    isTopUp,
    addressState,
    amount: controllerAmount
  } = state
  const { t } = useTranslation()
  const { networks } = useNetworksControllerState()
  const { search } = useRoute()
  const amountIsError = amountErrorSeverity === 'error' && !!amountErrorMessage
  const selectedTokenFromUrl = useMemo(() => getInfoFromSearch(search), [search])

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
      dispatch({
        type: 'TRANSFER_CONTROLLER_UPDATE_FORM',
        params: { formValues: { selectedToken: tokenToSelect, amount: '' } }
      })
    },
    [tokens, dispatch]
  )

  const setMaxAmount = useCallback(() => {
    dispatch({
      type: 'TRANSFER_CONTROLLER_UPDATE_FORM',
      params: {
        formValues: { shouldSetMaxAmount: true }
      }
    })
  }, [dispatch])

  const switchAmountFieldMode = useCallback(() => {
    dispatch({
      type: 'TRANSFER_CONTROLLER_UPDATE_FORM',
      params: {
        formValues: { amountFieldMode: amountFieldMode === 'token' ? 'fiat' : 'token' }
      }
    })
  }, [amountFieldMode, dispatch])

  useEffect(() => {
    if (tokens?.length && !state.selectedToken) {
      let tokenToSelect = tokens[0]

      if (selectedTokenFromUrl) {
        const correspondingToken = tokens.find(
          (token) =>
            token.address === selectedTokenFromUrl.addr &&
            token.chainId.toString() === selectedTokenFromUrl.chainId &&
            token.flags.onGasTank === false
        )

        if (correspondingToken) {
          tokenToSelect = correspondingToken
        }
      }

      if (tokenToSelect && getTokenAmount(tokenToSelect) > 0) {
        dispatch({
          type: 'TRANSFER_CONTROLLER_UPDATE_FORM',
          params: {
            formValues: { selectedToken: tokenToSelect }
          }
        })
      }
    }
  }, [tokens, selectedTokenFromUrl, state.selectedToken, dispatch])

  return (
    <ScrollableWrapper
      contentContainerStyle={[styles.container, isTopUp ? styles.topUpContainer : {}]}
    >
      <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mb]}>
        {!isTab && <PanelBackButton onPress={handleGoBack} style={spacings.mrSm} />}
        <PanelTitle title={isTopUp ? t('Top up Gas Tank') : t('Send')} />
        {!isTab && <View style={{ width: 40 }} />}
      </View>
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
      <Text appearance="secondaryText" fontSize={14} weight="medium" style={spacings.mbMi}>
        {!portfolio?.isReadyToVisualize ? t('Loading tokens...') : t('Select token')}
      </Text>
      {(!state.selectedToken && tokens.length) || !portfolio?.isReadyToVisualize ? (
        <SkeletonLoader width="100%" height={115} />
      ) : (
        <SendToken
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
    </ScrollableWrapper>
  )
}

export default React.memo(SendForm)
