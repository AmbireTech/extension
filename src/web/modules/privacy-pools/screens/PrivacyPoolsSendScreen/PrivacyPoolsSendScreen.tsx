import { formatUnits, isAddress, parseUnits } from 'ethers'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { getPrivacyPoolsAsset } from '@ambire-common/consts/privacyPools'
import { AddressState, AddressStateOptional } from '@ambire-common/interfaces/domains'
import { PrivacyPoolsSendForm } from '@ambire-common/interfaces/privacyPools'
import { getAddressFromAddressState } from '@ambire-common/utils/domains'
import { getSafeAmountFromFieldValue } from '@ambire-common/utils/numbers/formatters'
import Alert from '@common/components/Alert'
import ButtonWithLoader from '@common/components/ButtonWithLoader/ButtonWithLoader'
import { PanelBackButton, PanelTitle } from '@common/components/Panel/Panel'
import Recipient from '@common/components/Recipient'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import { SelectValue } from '@common/components/Select/types'
import SendToken from '@common/components/SendToken'
import TrackProgress from '@common/components/TrackProgress'
import Completed from '@common/components/TrackProgress/ByStatus/Completed'
import Failed from '@common/components/TrackProgress/ByStatus/Failed'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useAddressInput from '@common/hooks/useAddressInput'
import useController from '@common/hooks/useController'
import useNavigation from '@common/hooks/useNavigation'
import useSyncedState from '@common/hooks/useSyncedState'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { Content, Wrapper } from '@web/components/TransactionsScreen'
import PrivacyPoolsLoadingTexts from '@web/modules/privacy-pools/components/PrivacyPoolsLoadingTexts'
import PrivacyPoolsSendSheet from '@web/modules/privacy-pools/components/PrivacyPoolsSendSheet'
import usePrivacyPools from '@web/modules/privacy-pools/hooks/usePrivacyPools'
import usePrivacyPoolsTokens from '@web/modules/privacy-pools/hooks/usePrivacyPoolsTokens'
import { AmountFieldMode, getAmountsFromFieldValue } from '@web/modules/privacy-pools/utils/amount'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const NO_ADDRESS_RESOLUTION: Omit<AddressState, 'fieldValue'> = {
  resolvedAddress: '',
  resolvedAddressType: null,
  isDomainResolving: false
}

const NO_AMOUNTS = { amount: '', amountInFiat: '' }

const selectSendForm = (state: AllControllersMappingType['PrivacyPoolsController']) =>
  state.sendForm
const selectSendFormResetCounter = (state: AllControllersMappingType['PrivacyPoolsController']) =>
  state.sendFormResetCounter

/**
 * Send (a withdrawal, in protocol terms) from a Privacy Pools account, laid out like the regular
 * Send. Only approved funds can be sent. Proceed proves and prices the transfer (10s and up), then
 * `PrivacyPoolsSendSheet` shows the fee, which is known only once the transfer is built.
 *
 * What the user enters is kept in the Privacy Pools controller, so a closed popup reopens on it -
 * see `PrivacyPoolsController.sendForm`.
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
    recheckWithdrawal,
    broadcastWithdrawal,
    dismissOperation,
    isAvailable
  } = usePrivacyPools()
  const { withdrawTokens } = usePrivacyPoolsTokens({ tokenBalances, getNetworkName })
  const { ref: sheetRef, open: openSheet, close: closeSheet } = useModalize()
  const { state: sendForm, dispatch: privacyPoolsDispatch } = useController(
    'PrivacyPoolsController',
    selectSendForm
  )
  const { state: sendFormResetCounter } = useController(
    'PrivacyPoolsController',
    selectSendFormResetCounter
  )
  const { tokenId: selectedTokenValue, amountFieldMode } = sendForm

  const updateSendForm = useCallback(
    (update: Partial<PrivacyPoolsSendForm>) => {
      privacyPoolsDispatch({ type: 'method', params: { method: 'updateSendForm', args: [update] } })
    },
    [privacyPoolsDispatch]
  )

  // Typed fields are kept here too, so typing does not wait for the controller
  const [recipientFieldValue, setRecipientFieldValue] = useSyncedState<string>({
    backgroundState: sendForm.recipientFieldValue,
    updateBackgroundState: (fieldValue) => updateSendForm({ recipientFieldValue: fieldValue }),
    forceUpdateOnChangeList: [sendFormResetCounter]
  })
  // Both token and USD amounts are kept, so switching the field mode does not clear the input
  const controllerAmounts = useMemo(
    () => ({ amount: sendForm.amount, amountInFiat: sendForm.amountInFiat }),
    [sendForm.amount, sendForm.amountInFiat]
  )
  const [amounts, setAmounts] = useSyncedState<typeof NO_AMOUNTS>({
    backgroundState: controllerAmounts,
    updateBackgroundState: updateSendForm,
    forceUpdateOnChangeList: [sendFormResetCounter]
  })

  // Not kept: a domain name in the field is resolved again when the screen opens
  const [addressResolution, setAddressResolution] = useState<AddressStateOptional>({})
  // The field value is owned by the synced state above; the input only reports it back along
  // with what it resolved to
  const addressState: AddressState = useMemo(
    () => ({ ...NO_ADDRESS_RESOLUTION, ...addressResolution, fieldValue: recipientFieldValue }),
    [addressResolution, recipientFieldValue]
  )
  const updateAddressResolution = useCallback((update: AddressStateOptional) => {
    setAddressResolution((previous) => ({ ...previous, ...update }))
  }, [])
  const addressInputState = useAddressInput({
    addressState,
    setAddressState: updateAddressResolution
  })
  const recipient = getAddressFromAddressState(addressState)

  // Falls back to the first token if none is picked or the picked one runs out
  const selectedToken = useMemo(
    () =>
      withdrawTokens.find(({ value }) => value === selectedTokenValue) || withdrawTokens[0] || null,
    [withdrawTokens, selectedTokenValue]
  )

  const handleChangeToken = useCallback(
    (option: SelectValue) => {
      updateSendForm({ tokenId: String(option.value) })
      setAmounts(NO_AMOUNTS)
    },
    [setAmounts, updateSendForm]
  )

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
    [fieldMode, selectedToken?.decimals, setAmounts, tokenPrice]
  )
  const switchAmountFieldMode = useCallback(
    () => updateSendForm({ amountFieldMode: amountFieldMode === 'token' ? 'fiat' : 'token' }),
    [amountFieldMode, updateSendForm]
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
    [maxAmount, selectedToken?.decimals, setAmounts, tokenPrice]
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
  // Proving and pricing, before the fee sheet opens. The form is locked meanwhile, as the transfer
  // is proved for what it held on Proceed; leaving the screen cancels it.
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

  // Opens the sheet when the transfer is ready. One already ready on coming back to the screen is
  // opened by the sheet itself - see `PrivacyPoolsSendSheet`
  const operationPhase = operation?.phase
  const operationStatus = operation?.status
  useEffect(() => {
    if (operationStatus !== 'pending' || operationPhase !== 'ready') return

    openSheet()
  }, [operationStatus, operationPhase, openSheet])

  /**
   * Sent, or could not be sent from the confirmation sheet: shown on its own screen, like the regular
   * Send's outcome. A failure while preparing it is only a toast, as the user is still on the form.
   */
  const isOutcomeShown =
    operation?.status === 'success' ||
    (operation?.status === 'failed' && operationPhase !== 'proving')

  // Backing out of the confirmation drops the proved transfer. An outcome stays for its screen
  const handleSheetClosed = useCallback(() => {
    if (operationStatus !== 'pending') return

    dismissOperation()
  }, [dismissOperation, operationStatus])

  // The controller already cleared the form of a transfer handed over, even a failed one
  const closeOutcome = useCallback(() => {
    dismissOperation()
    navigate(ROUTES.dashboard)
  }, [dismissOperation, navigate])

  // The operation carries raw amounts; the token's symbol and decimals come from the asset config
  const operationAsset = useMemo(
    () =>
      operation ? getPrivacyPoolsAsset(BigInt(operation.chainId), operation.tokenAddress) : null,
    [operation]
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

  if (isOutcomeShown && operation) {
    const hasFailed = operation.status === 'failed'

    return (
      <TrackProgress
        onPrimaryButtonPress={closeOutcome}
        secondaryButtonText={hasFailed ? t('Back') : t('Send more')}
        handleClose={dismissOperation}
        routeStatus={hasFailed ? 'failed' : undefined}
      >
        {/* No explorer link: the transfer's hash is not kept */}
        {hasFailed ? (
          <Failed
            title={t('Something went wrong!')}
            errorMessage={
              operation.error ||
              t(
                'We could not confirm the transfer yet. Check your balance before you send it again.'
              )
            }
          />
        ) : (
          <Completed
            title={t('Sending successfully')}
            titleSecondary={t('Your {{symbol}} is on its way. No trail back to you.', {
              symbol: operationAsset?.symbol || t('Token')
            })}
            openExplorerText={t('View Transfer')}
          />
        )}
      </TrackProgress>
    )
  }

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
            address={recipientFieldValue}
            setAddress={setRecipientFieldValue}
            validation={addressInputState.validation}
            resolvedAddress={addressState.resolvedAddress}
            resolvedAddressType={addressState.resolvedAddressType}
            isRecipientDomainResolving={addressState.isDomainResolving}
            addressValidationMsg={addressInputState.validation.message}
            selectedTokenSymbol={selectedToken?.symbol}
            disabled={isTransferInFlight}
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
            fromTokenAmountSelectDisabled={!withdrawTokens.length || isTransferInFlight}
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
          {/* At the bottom, right above the button */}
          {isPreparingTransfer && (
            <View style={{ marginTop: 'auto' }}>
              <PrivacyPoolsLoadingTexts />
            </View>
          )}
        </ScrollableWrapper>
      </Content>

      <PrivacyPoolsSendSheet
        operation={operation}
        symbol={operationAsset?.symbol || ''}
        sheetRef={sheetRef}
        closeBottomSheet={closeSheet}
        onSend={broadcastWithdrawal}
        onRecheck={recheckWithdrawal}
        onClosed={handleSheetClosed}
      />
    </Wrapper>
  )
}

export default React.memo(PrivacyPoolsSendScreen)
