import { formatUnits, isAddress, parseUnits } from 'ethers'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { TORNADO_CASH_CHAIN_ID, TORNADO_CASH_POOLS } from '@ambire-common/consts/tornadoCash'
import { AddressState, AddressStateOptional } from '@ambire-common/interfaces/domains'
import { pickTornadoCashNotes, TornadoCashNoteCount } from '@ambire-common/libs/tornadoCash/amounts'
import { getAddressFromAddressState } from '@ambire-common/utils/domains'
import { getSafeAmountFromFieldValue } from '@ambire-common/utils/numbers/formatters'
import Alert from '@common/components/Alert'
import ButtonWithLoader from '@common/components/ButtonWithLoader/ButtonWithLoader'
import { PanelBackButton, PanelTitle } from '@common/components/Panel/Panel'
import Recipient from '@common/components/Recipient'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import { SelectValue } from '@common/components/Select/types'
import SendToken from '@common/components/SendToken'
import Text from '@common/components/Text'
import TrackProgress from '@common/components/TrackProgress'
import Completed from '@common/components/TrackProgress/ByStatus/Completed'
import Failed from '@common/components/TrackProgress/ByStatus/Failed'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useAddressInput from '@common/hooks/useAddressInput'
import useNavigation from '@common/hooks/useNavigation'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { Content, Wrapper } from '@web/components/TransactionsScreen'
import PrivacyPoolsLoadingTexts from '@web/modules/privacy-pools/components/PrivacyPoolsLoadingTexts'
import { getTokenOption } from '@web/modules/privacy-pools/hooks/usePrivacyPoolsTokens/usePrivacyPoolsTokens'
import TornadoCashSendSheet from '@web/modules/tornado-cash/components/TornadoCashSendSheet'
import useTornadoCash from '@web/modules/tornado-cash/hooks/useTornadoCash'

const NO_ADDRESS_STATE: AddressState = {
  fieldValue: '',
  resolvedAddress: '',
  resolvedAddressType: null,
  isDomainResolving: false
}

const CHAIN_ID = TORNADO_CASH_CHAIN_ID.toString()

/** An amount in token units without a needless ".0". */
const formatAmount = (amount: bigint, decimals: number) => {
  const formatted = formatUnits(amount, decimals)
  return formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted
}

/**
 * Send (a withdrawal, in protocol terms) from a Tornado Cash account, laid out like the Privacy
 * Pools one. Only whole notes can be sent, so the amount must be a sum of the account's notes.
 * Proceed proves the send (it can take a while per note), then `TornadoCashSendSheet` shows the
 * fee, which is known only once it is built.
 */
const TornadoCashSendScreen = () => {
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const { operation, balances, noteBalances, isAvailable, dispatch } = useTornadoCash()
  const { ref: sheetRef, open: openSheet, close: closeSheet } = useModalize()

  const [addressState, setAddressState] = useState<AddressState>(NO_ADDRESS_STATE)
  const updateAddressState = useCallback((update: AddressStateOptional) => {
    setAddressState((previous) => ({ ...previous, ...update }))
  }, [])
  const setRecipientFieldValue = useCallback(
    (fieldValue: string) => updateAddressState({ fieldValue }),
    [updateAddressState]
  )
  const addressInputState = useAddressInput({ addressState, setAddressState: updateAddressState })
  const recipient = getAddressFromAddressState(addressState)

  const tokenOptions = useMemo(
    () =>
      balances.map((balance) =>
        getTokenOption({
          chainId: CHAIN_ID,
          tokenAddress: balance.tokenAddress,
          isNative: balance.symbol === 'ETH',
          symbol: balance.symbol,
          decimals: balance.decimals,
          networkName: 'Ethereum',
          note: balance.notesSummary || '',
          availableAmount: parseUnits(balance.totalAmount, balance.decimals)
        })
      ),
    [balances]
  )
  const [selectedTokenValue, setSelectedTokenValue] = useState<string | null>(null)
  const selectedToken = useMemo(
    () => tokenOptions.find(({ value }) => value === selectedTokenValue) || tokenOptions[0] || null,
    [selectedTokenValue, tokenOptions]
  )
  const [amount, setAmount] = useState('')

  const handleChangeToken = useCallback(
    (option: SelectValue) => {
      setSelectedTokenValue(String(option.value))
      setAmount('')
    },
    [setAmount]
  )

  // The account's notes of the selected token, for checking the amount as the SDK will pick them
  const ownedNotes: TornadoCashNoteCount[] = useMemo(() => {
    const balance = noteBalances.find(
      ({ assetAddress }) => assetAddress.toLowerCase() === selectedToken?.tokenAddress.toLowerCase()
    )
    if (!balance) return []

    return balance.notes.flatMap(({ denomination, count }) => {
      const pool = TORNADO_CASH_POOLS.find(
        (candidate) =>
          candidate.assetAddress.toLowerCase() === balance.assetAddress.toLowerCase() &&
          candidate.denomination === denomination
      )
      return pool ? [{ pool, count }] : []
    })
  }, [noteBalances, selectedToken])

  const maxAmount = selectedToken
    ? formatUnits(selectedToken.availableAmount, selectedToken.decimals)
    : '0'

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
    if (!pickTornadoCashNotes(ownedNotes, parsedAmount))
      return {
        success: false,
        severity: 'error' as const,
        message: t(
          'Tornado Cash sends only whole parts of your balance. Pick an amount your parts add up to.'
        )
      }

    return { success: true }
  }, [maxAmount, ownedNotes, parsedAmount, selectedToken, t])

  const isSendInFlight = operation?.status === 'pending'
  const isPreparingSend = isSendInFlight && operation?.phase === 'proving'
  const canSend =
    isAvailable &&
    !!selectedToken &&
    amountValidation.success &&
    addressInputState.validation.severity !== 'error' &&
    isAddress(recipient) &&
    !addressState.isDomainResolving &&
    !isSendInFlight

  const handleSend = useCallback(() => {
    if (!canSend || !selectedToken || parsedAmount === null) return

    dispatch({
      type: 'method',
      params: {
        method: 'prepareWithdrawal',
        args: [{ assetAddress: selectedToken.tokenAddress, amount: parsedAmount, recipient }]
      }
    })
  }, [canSend, dispatch, parsedAmount, recipient, selectedToken])

  const broadcast = useCallback(
    () => dispatch({ type: 'method', params: { method: 'broadcastWithdrawal', args: [] } }),
    [dispatch]
  )
  const dismissOperation = useCallback(
    () => dispatch({ type: 'method', params: { method: 'dismissOperation', args: [] } }),
    [dispatch]
  )

  // Opens the sheet once the send is proved and its fee known
  const operationPhase = operation?.phase
  const operationStatus = operation?.status
  useEffect(() => {
    if (operationStatus !== 'pending' || operationPhase !== 'ready') return

    openSheet()
  }, [operationStatus, operationPhase, openSheet])

  // Sent, or failed after it left the form: shown on its own screen, like the regular Send's outcome
  const isOutcomeShown =
    operationPhase === 'finalizing' ||
    operationStatus === 'success' ||
    (operationStatus === 'failed' && operationPhase !== 'proving')

  // Backing out of the confirmation drops the proved send. An outcome stays for its screen
  const handleSheetClosed = useCallback(() => {
    if (operationStatus !== 'pending' || operationPhase !== 'ready') return

    dismissOperation()
  }, [dismissOperation, operationPhase, operationStatus])

  const closeOutcome = useCallback(() => {
    dismissOperation()
    navigate(ROUTES.dashboard)
  }, [dismissOperation, navigate])

  const selectedTokenForField = useMemo(
    () =>
      selectedToken
        ? { symbol: selectedToken.symbol, decimals: selectedToken.decimals, priceIn: [] }
        : null,
    [selectedToken]
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
        {hasFailed ? (
          <Failed
            title={t('Something went wrong!')}
            errorMessage={
              operation.error ||
              t('We could not confirm the send yet. Check your balance before you send it again.')
            }
          />
        ) : (
          <Completed
            title={operation.status === 'success' ? t('Sending successfully') : t('Sending...')}
            titleSecondary={t('Your {{symbol}} is on its way. No trail back to you.', {
              symbol: operation.symbol
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
            testID="tornado-cash-send-button"
            text={t('Proceed')}
            onPress={handleSend}
            disabled={!canSend}
            isLoading={isPreparingSend}
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
            setAddress={setRecipientFieldValue}
            validation={addressInputState.validation}
            resolvedAddress={addressState.resolvedAddress}
            resolvedAddressType={addressState.resolvedAddressType}
            isRecipientDomainResolving={addressState.isDomainResolving}
            addressValidationMsg={addressInputState.validation.message}
            selectedTokenSymbol={selectedToken?.symbol}
            disabled={isSendInFlight}
          />

          {!tokenOptions.length && (
            <Alert
              type="info"
              size="sm"
              style={spacings.mbTy}
              text={t('There is nothing to send yet. Send tokens to this account first.')}
            />
          )}

          <SendToken
            label={t('Send token')}
            fromTokenOptions={tokenOptions}
            fromTokenValue={selectedToken || undefined}
            fromAmountValue={amount}
            fromTokenAmountSelectDisabled={!tokenOptions.length || isSendInFlight}
            handleChangeFromToken={handleChangeToken}
            fromSelectedToken={selectedTokenForField}
            fromAmount={amount}
            fromAmountInFiat=""
            fromAmountFieldMode="token"
            maxFromAmount={maxAmount}
            validateFromAmount={amountValidation}
            onFromAmountChange={setAmount}
            handleSwitchFromAmountFieldMode={() => {}}
            handleSetMaxFromAmount={() => setAmount(maxAmount)}
            isMaxAmountLoading={false}
            inputTestId="tornado-cash-amount-field"
            selectTestId="tornado-cash-tokens-select"
          />
          {!!ownedNotes.length && (
            <Text fontSize={12} appearance="secondaryText" style={spacings.mtSm}>
              {t('Your balance is made of {{parts}}. Each part is sent whole.', {
                parts: ownedNotes
                  .map(
                    ({ pool, count }) =>
                      `${count} × ${formatAmount(pool.denomination, pool.decimals)} ${pool.symbol}`
                  )
                  .join(', ')
              })}
            </Text>
          )}
          {isPreparingSend && (
            <View style={{ marginTop: 'auto' }}>
              <PrivacyPoolsLoadingTexts />
            </View>
          )}
        </ScrollableWrapper>
      </Content>

      <TornadoCashSendSheet
        operation={operation}
        sheetRef={sheetRef}
        closeBottomSheet={closeSheet}
        onSend={broadcast}
        onClosed={handleSheetClosed}
      />
    </Wrapper>
  )
}

export default React.memo(TornadoCashSendScreen)
