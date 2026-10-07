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
 * Send (a withdrawal, in protocol terms) from a Privacy Pools account, laid out like the regular
 * Send. Only approved funds can be sent. Proceed proves and prices the transfer (10s and up), then
 * `PrivacyPoolsSendSheet` shows the fee, which is known only once the transfer is built.
 */
const PrivacyPoolsSendScreen = () => {
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const {
    operation,
    tokenBalances,
    getNetworkName,
    getTokenPrice,
    prepareWithdrawal,
    broadcastWithdrawal,
    dismissOperation,
    isAvailable
  } = usePrivacyPools()
  const { withdrawTokens } = usePrivacyPoolsTokens({ tokenBalances, getNetworkName })
  const { ref: sheetRef, open: openSheet, close: closeSheet } = useModalize()

  const [addressState, setAddressState] = useState<AddressState>(DEFAULT_ADDRESS_STATE)
  const [selectedTokenValue, setSelectedTokenValue] = useState('')
  // Both token and USD amounts are kept, so switching the field mode does not clear the input
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

  // Falls back to the first token if none is picked or the picked one runs out
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
  // No USD input without a price
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
      // An in-progress entry like "0." is not shown as an error; the button stays disabled
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
  // Proving and pricing, before the fee sheet opens
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

    // The fee sheet opens once the transfer is proved and priced - see the effect below
    prepareWithdrawal({
      chainId: selectedToken.chainId,
      tokenAddress: selectedToken.tokenAddress,
      amount: parsedAmount,
      recipient
    })
  }, [canSend, parsedAmount, prepareWithdrawal, recipient, selectedToken])

  // Opens the sheet when the transfer is ready, also on coming back to the screen while one waits
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

  // The operation carries raw amounts; the token's symbol and decimals come from the asset config
  const operationAsset = useMemo(
    () =>
      operation ? getPrivacyPoolsAsset(BigInt(operation.chainId), operation.tokenAddress) : null,
    [operation]
  )

  // The operation's token may differ from the one now picked in the form
  const operationTokenPrice = useMemo(
    () => (operation ? getTokenPrice(operation.chainId, operation.tokenAddress) : null),
    [getTokenPrice, operation]
  )

  // Priced by the Privacy Pools controller, as the account has no portfolio
  const selectedTokenForField = useMemo(
    () =>
      selectedToken
        ? {
            symbol: selectedToken.symbol,
            decimals: selectedToken.decimals,
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
