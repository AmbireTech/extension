import { formatUnits, isAddress, parseUnits } from 'ethers'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { getPrivacyPoolsAsset } from '@ambire-common/consts/privacyPools'
import { AddressState, AddressStateOptional } from '@ambire-common/interfaces/domains'
import { getAddressFromAddressState } from '@ambire-common/utils/domains'
import Alert from '@common/components/Alert'
import Button from '@common/components/Button'
import { PanelBackButton, PanelTitle } from '@common/components/Panel/Panel'
import Recipient from '@common/components/Recipient'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import { SelectValue } from '@common/components/Select/types'
import SendToken from '@common/components/SendToken'
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

const DEFAULT_ADDRESS_STATE: AddressState = {
  fieldValue: '',
  resolvedAddress: '',
  resolvedAddressType: null,
  isDomainResolving: false
}

// Nothing to price it in: the pooled tokens are not the selected account's portfolio
const NO_PRICES: never[] = []

// There is no fiat mode to switch to without prices
const noop = () => {}

/**
 * Send from a Privacy Pools account - a withdrawal, in the protocol's terms - laid out like the
 * regular Send: a recipient, a token and an amount.
 *
 * Only what the association set has approved can be sent. Proving, the fee and sending happen in
 * `PrivacyPoolsSendSheet`, the way the regular Send hands over to its fee sheet: the proof takes
 * ten seconds and up, and the fee is known only once it is built.
 */
const PrivacyPoolsSendScreen = () => {
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const {
    operation,
    getNetworkName,
    prepareWithdrawal,
    broadcastWithdrawal,
    dismissOperation,
    isAvailable
  } = usePrivacyPools()
  const { withdrawTokens } = usePrivacyPoolsTokens()
  const { ref: sheetRef, open: openSheet, close: closeSheet } = useModalize()

  const [addressState, setAddressState] = useState<AddressState>(DEFAULT_ADDRESS_STATE)
  const [selectedTokenValue, setSelectedTokenValue] = useState('')
  const [amount, setAmount] = useState('')

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
    setAmount('')
  }, [])

  const maxAmount = useMemo(
    () =>
      selectedToken ? formatUnits(selectedToken.availableAmount, selectedToken.decimals) : '0',
    [selectedToken]
  )
  const setMaxAmount = useCallback(() => setAmount(maxAmount), [maxAmount])

  const parsedAmount = useMemo(() => {
    if (!selectedToken || !amount) return null

    try {
      return parseUnits(amount, selectedToken.decimals)
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

    // Opened as the transfer is dispatched rather than once the background reports back: proving
    // takes ten seconds and up, which would otherwise be a closed form and nothing to look at
    openSheet()
    prepareWithdrawal({
      chainId: selectedToken.chainId,
      tokenAddress: selectedToken.tokenAddress,
      amount: parsedAmount,
      recipient
    })
  }, [canSend, openSheet, parsedAmount, prepareWithdrawal, recipient, selectedToken])

  // Brings the sheet back for the confirmation, should it have been closed while proving: closing
  // it cancels nothing, and a proved transfer would otherwise wait on a confirmation nowhere on
  // screen
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
    setAmount('')
    navigate(ROUTES.dashboard)
  }, [dismissOperation, navigate, operation?.status])

  // Described in the token's own units, which only the pool's asset config knows - the operation
  // itself carries raw amounts
  const operationAsset = useMemo(
    () =>
      operation ? getPrivacyPoolsAsset(BigInt(operation.chainId), operation.tokenAddress) : null,
    [operation]
  )

  const selectedTokenForField = useMemo(
    () => (selectedToken ? { symbol: selectedToken.symbol, priceIn: NO_PRICES } : null),
    [selectedToken]
  )

  return (
    <Wrapper>
      <Content
        buttons={
          <Button
            testID="privacy-pools-send-button"
            text={t('Send')}
            onPress={handleSend}
            disabled={!canSend}
            hasBottomSpacing={false}
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
            fromAmountValue={amount}
            fromTokenAmountSelectDisabled={!withdrawTokens.length}
            handleChangeFromToken={handleChangeToken}
            fromSelectedToken={selectedTokenForField}
            fromAmount={amount}
            fromAmountFieldMode="token"
            maxFromAmount={maxAmount}
            validateFromAmount={amountValidation}
            onFromAmountChange={setAmount}
            handleSwitchFromAmountFieldMode={noop}
            handleSetMaxFromAmount={setMaxAmount}
            isMaxAmountLoading={false}
            inputTestId="privacy-pools-amount-field"
            selectTestId="privacy-pools-tokens-select"
          />

          <Alert
            type="info"
            size="sm"
            style={spacings.mtSm}
            text={t(
              'The address you send to cannot be linked to how the funds got into this account. The network fee is taken from the amount you send, so that address does not need any ETH. Nothing is sent until you confirm the fee.'
            )}
          />
        </ScrollableWrapper>
      </Content>

      <PrivacyPoolsSendSheet
        operation={operation}
        symbol={operationAsset?.symbol || ''}
        decimals={operationAsset?.decimals ?? 18}
        networkName={operation ? getNetworkName(operation.chainId) : ''}
        sheetRef={sheetRef}
        closeBottomSheet={closeSheet}
        onSend={broadcastWithdrawal}
        onClosed={handleSheetClosed}
      />
    </Wrapper>
  )
}

export default React.memo(PrivacyPoolsSendScreen)
