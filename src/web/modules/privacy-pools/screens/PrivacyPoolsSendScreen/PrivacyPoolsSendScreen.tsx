import { formatUnits, isAddress, parseUnits } from 'ethers'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { getPrivacyPoolsAsset } from '@ambire-common/consts/privacyPools'
import { AddressState, AddressStateOptional } from '@ambire-common/interfaces/domains'
import { getAddressFromAddressState } from '@ambire-common/utils/domains'
import { getSafeAmountFromFieldValue } from '@ambire-common/utils/numbers/formatters'
import Alert from '@common/components/Alert'
import ButtonWithLoader from '@common/components/ButtonWithLoader/ButtonWithLoader'
import { PanelBackButton, PanelTitle } from '@common/components/Panel/Panel'
import Recipient from '@common/components/Recipient'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import { SelectValue } from '@common/components/Select/types'
import SendToken from '@common/components/SendToken'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useAddressInput from '@common/hooks/useAddressInput'
import useNavigation from '@common/hooks/useNavigation'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { Content, Wrapper } from '@web/components/TransactionsScreen'
import PrivacyPoolsSendSheet from '@web/modules/privacy-pools/components/PrivacyPoolsSendSheet'
import usePrivacyPools from '@web/modules/privacy-pools/hooks/usePrivacyPools'
import usePrivacyPoolsTokens from '@web/modules/privacy-pools/hooks/usePrivacyPoolsTokens'
import { AmountFieldMode, getAmountsFromFieldValue } from '@web/modules/privacy-pools/utils/amount'

const DEFAULT_ADDRESS_STATE: AddressState = {
  fieldValue: '',
  resolvedAddress: '',
  resolvedAddressType: null,
  isDomainResolving: false
}

const NO_AMOUNTS = { amount: '', amountInFiat: '' }

/**
 * Send from a Privacy Pools account - a withdrawal, in the protocol's terms - laid out like the
 * regular Send: a recipient, a token and an amount, typed in the token or in USD.
 *
 * Only what the association set has approved can be sent. Proceed proves and prices the transfer
 * - ten seconds and up, shown on the button - and only then hands over to `PrivacyPoolsSendSheet`
 * for the fee and sending, the way the regular Send hands over to its fee sheet: the fee is known
 * only once the transfer is built.
 */
const PrivacyPoolsSendScreen = () => {
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const {
    operation,
    getTokenPrice,
    prepareWithdrawal,
    broadcastWithdrawal,
    dismissOperation,
    isAvailable
  } = usePrivacyPools()
  const { withdrawTokens } = usePrivacyPoolsTokens()
  const { ref: sheetRef, open: openSheet, close: closeSheet } = useModalize()

  const [addressState, setAddressState] = useState<AddressState>(DEFAULT_ADDRESS_STATE)
  const [selectedTokenValue, setSelectedTokenValue] = useState('')
  // Both sides of the amount are kept, like the regular Send's, so switching what it is typed in
  // shows the other side instead of starting over
  const [amounts, setAmounts] = useState(NO_AMOUNTS)
  const [amountFieldMode, setAmountFieldMode] = useState<AmountFieldMode>('token')

  const updateAddressState = useCallback((update: AddressStateOptional) => {
    setAddressState((previous) => ({ ...previous, ...update }))
  }, [])
  const setAddressFieldValue = useCallback(
    (fieldValue: string) => updateAddressState({ fieldValue }),
    [updateAddressState]
  )
  const addressInputState = useAddressInput({ addressState, setAddressState: updateAddressState })
  const recipient = getAddressFromAddressState(addressState)

  // The first token until one is picked, and again if the picked one runs out
  const selectedToken = useMemo(
    () =>
      withdrawTokens.find(({ value }) => value === selectedTokenValue) || withdrawTokens[0] || null,
    [withdrawTokens, selectedTokenValue]
  )

  const handleChangeToken = useCallback((option: SelectValue) => {
    setSelectedTokenValue(String(option.value))
    setAmounts(NO_AMOUNTS)
  }, [])

  const tokenPrice = useMemo(
    () => (selectedToken ? getTokenPrice(selectedToken.chainId, selectedToken.tokenAddress) : null),
    [getTokenPrice, selectedToken]
  )
  // There is nothing to type a USD amount against without a price
  const fieldMode: AmountFieldMode = tokenPrice === null ? 'token' : amountFieldMode

  const setAmountFieldValue = useCallback(
    (fieldValue: string) =>
      setAmounts(
        getAmountsFromFieldValue({
          fieldValue,
          fieldMode,
          price: tokenPrice,
          decimals: selectedToken?.decimals ?? 18
        })
      ),
    [fieldMode, selectedToken?.decimals, tokenPrice]
  )
  const switchAmountFieldMode = useCallback(
    () => setAmountFieldMode((mode) => (mode === 'token' ? 'fiat' : 'token')),
    []
  )

  const maxAmount = useMemo(
    () =>
      selectedToken ? formatUnits(selectedToken.availableAmount, selectedToken.decimals) : '0',
    [selectedToken]
  )
  const setMaxAmount = useCallback(
    () =>
      setAmounts(
        getAmountsFromFieldValue({
          fieldValue: maxAmount,
          fieldMode: 'token',
          price: tokenPrice,
          decimals: selectedToken?.decimals ?? 18
        })
      ),
    [maxAmount, selectedToken?.decimals, tokenPrice]
  )

  const { amount } = amounts
  const parsedAmount = useMemo(() => {
    if (!selectedToken || !amount) return null

    try {
      return parseUnits(
        getSafeAmountFromFieldValue(amount, selectedToken.decimals),
        selectedToken.decimals
      )
    } catch {
      // An in-progress entry like "0." is not an error worth showing; the button stays disabled
      return null
    }
  }, [amount, selectedToken])

  const amountValidation = useMemo(() => {
    if (!selectedToken || parsedAmount === null) return { success: false }
    if (parsedAmount <= 0n)
      return {
        success: false,
        severity: 'error' as const,
        message: t('Enter an amount greater than zero.')
      }
    if (parsedAmount > selectedToken.availableAmount)
      return {
        success: false,
        severity: 'error' as const,
        message: t('You can send at most {{max}} {{symbol}}.', {
          max: maxAmount,
          symbol: selectedToken.symbol
        })
      }

    return { success: true }
  }, [maxAmount, parsedAmount, selectedToken, t])

  const isTransferInFlight = operation?.status === 'pending'
  // Proving and pricing it, which is what the Proceed button waits on before the fee sheet opens
  const isPreparingTransfer = isTransferInFlight && operation?.phase === 'proving'
  const canSend =
    isAvailable &&
    !!selectedToken &&
    amountValidation.success &&
    addressInputState.validation.severity !== 'error' &&
    isAddress(recipient) &&
    !addressState.isDomainResolving &&
    !isTransferInFlight

  const handleSend = useCallback(() => {
    if (!canSend || !selectedToken || parsedAmount === null) return

    // The fee sheet opens only once the transfer is proved and priced - see below. Until then the
    // Proceed button shows the wait, the way the regular Send's does while it estimates
    prepareWithdrawal({
      chainId: selectedToken.chainId,
      tokenAddress: selectedToken.tokenAddress,
      amount: parsedAmount,
      recipient
    })
  }, [canSend, parsedAmount, prepareWithdrawal, recipient, selectedToken])

  // Opens the sheet for the confirmation once the transfer is ready to send - also on coming back to
  // the screen while one waits, since a proved transfer would otherwise wait on a confirmation
  // nowhere on screen
  const operationPhase = operation?.phase
  const operationStatus = operation?.status
  useEffect(() => {
    if (operationStatus !== 'pending' || operationPhase !== 'ready') return

    openSheet()
  }, [operationStatus, operationPhase, openSheet])

  const handleSheetClosed = useCallback(() => {
    const wasSent = operation?.status === 'success'
    dismissOperation()
    if (!wasSent) return

    setAddressState(DEFAULT_ADDRESS_STATE)
    setAmounts(NO_AMOUNTS)
    navigate(ROUTES.dashboard)
  }, [dismissOperation, navigate, operation?.status])

  // Described in the token's own units, which only the pool's asset config knows - the operation
  // itself carries raw amounts
  const operationAsset = useMemo(
    () =>
      operation ? getPrivacyPoolsAsset(BigInt(operation.chainId), operation.tokenAddress) : null,
    [operation]
  )

  // The operation's own token, which is not necessarily the one picked in the form by now
  const operationTokenPrice = useMemo(
    () => (operation ? getTokenPrice(operation.chainId, operation.tokenAddress) : null),
    [getTokenPrice, operation]
  )

  // Priced by the Privacy Pools controller - the pooled tokens are not the selected account's
  // portfolio
  const selectedTokenForField = useMemo(
    () =>
      selectedToken
        ? {
            symbol: selectedToken.symbol,
            priceIn: tokenPrice === null ? [] : [{ baseCurrency: 'usd', price: tokenPrice }]
          }
        : null,
    [selectedToken, tokenPrice]
  )

  return (
    <Wrapper>
      <Content
        buttons={
          <ButtonWithLoader
            testID="privacy-pools-send-button"
            text={t('Proceed')}
            onPress={handleSend}
            disabled={!canSend}
            isLoading={isPreparingTransfer}
            size={isWeb ? 'smaller' : 'regular'}
          />
        }
      >
        <ScrollableWrapper style={flexbox.flex1} contentContainerStyle={flexbox.flex1}>
          <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mb]}>
            <PanelBackButton onPress={() => navigate(ROUTES.dashboard)} style={spacings.mrSm} />
            <PanelTitle title={t('Send')} />
            <View style={{ width: 40 }} />
          </View>

          <Recipient
            address={addressState.fieldValue}
            setAddress={setAddressFieldValue}
            validation={addressInputState.validation}
            resolvedAddress={addressState.resolvedAddress}
            resolvedAddressType={addressState.resolvedAddressType}
            isRecipientDomainResolving={addressState.isDomainResolving}
            addressValidationMsg={addressInputState.validation.message}
            selectedTokenSymbol={selectedToken?.symbol}
          />

          {!withdrawTokens.length && (
            <Alert
              type="info"
              size="sm"
              style={spacings.mbTy}
              text={t(
                'There is nothing to send yet. Either nothing has been sent to this account, or what has is still waiting for Privacy Pools to approve it.'
              )}
            />
          )}

          <SendToken
            label={t('Send token')}
            fromTokenOptions={withdrawTokens}
            fromTokenValue={selectedToken || undefined}
            fromAmountValue={fieldMode === 'token' ? amount : amounts.amountInFiat}
            fromTokenAmountSelectDisabled={!withdrawTokens.length}
            handleChangeFromToken={handleChangeToken}
            fromSelectedToken={selectedTokenForField}
            fromAmount={amount}
            fromAmountInFiat={amounts.amountInFiat}
            fromAmountFieldMode={fieldMode}
            maxFromAmount={maxAmount}
            validateFromAmount={amountValidation}
            onFromAmountChange={setAmountFieldValue}
            handleSwitchFromAmountFieldMode={switchAmountFieldMode}
            handleSetMaxFromAmount={setMaxAmount}
            isMaxAmountLoading={false}
            inputTestId="privacy-pools-amount-field"
            selectTestId="privacy-pools-tokens-select"
          />
        </ScrollableWrapper>
      </Content>

      <PrivacyPoolsSendSheet
        operation={operation}
        symbol={operationAsset?.symbol || ''}
        decimals={operationAsset?.decimals ?? 18}
        tokenPrice={operationTokenPrice}
        sheetRef={sheetRef}
        closeBottomSheet={closeSheet}
        onSend={broadcastWithdrawal}
        onClosed={handleSheetClosed}
      />
    </Wrapper>
  )
}

export default React.memo(PrivacyPoolsSendScreen)
