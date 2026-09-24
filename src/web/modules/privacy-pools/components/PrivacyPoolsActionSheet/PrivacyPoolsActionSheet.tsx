import { formatUnits, parseUnits } from 'ethers'
import React, { FC, useCallback, useMemo, useState } from 'react'
import { View } from 'react-native'

import { isValidAddress } from '@ambire-common/services/address'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import Alert from '@common/components/Alert'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import Button from '@common/components/Button'
import Input from '@common/components/Input'
import NumberInput from '@common/components/NumberInput'
import Select from '@common/components/Select'
import { SelectValue } from '@common/components/Select/types'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { PrivacyPoolsTokenOption } from '@web/modules/privacy-pools/hooks/usePrivacyPoolsTokens/usePrivacyPoolsTokens'

export type PrivacyPoolsActionSubmitParams = {
  // The pool the action runs against, taken from the selected token rather than from a screen-wide
  // network selection - each chain has its own pools and entrypoint.
  chainId: string
  tokenAddress: string
  amount: bigint
  recipient: string
}

interface Props {
  tokens: PrivacyPoolsTokenOption[]
  sheetRef: React.RefObject<any>
  closeBottomSheet: () => void
  onSubmit: (params: PrivacyPoolsActionSubmitParams) => void
}

// The words of the form. Kept together, so the form reads as one piece of copy.
const FORM_COPY = {
  title: 'Withdraw',
  description: 'Take funds out of the pools, to any address you choose.',
  submitText: 'Prepare withdrawal',
  tokenLabel: 'Pooled token',
  noTokensText:
    'Nothing can be withdrawn yet. Either nothing has been sent to this account, or what has is still waiting to be approved.',
  note: 'Nothing is sent until you confirm. Preparing takes up to half a minute - the network fee and the exact amount the address receives are shown before anything leaves the pool. The fee is taken from the withdrawn amount, so the receiving address does not need any ETH.'
}

/**
 * The withdrawal form. Sending into the account is not done here: it is a transfer from another of
 * the wallet's accounts, made from that account's Send.
 *
 * The network comes from the selected token rather than from a separate dropdown - a token and the
 * pool it sits in are one choice, not two.
 */
const PrivacyPoolsActionSheet: FC<Props> = ({ tokens, sheetRef, closeBottomSheet, onSubmit }) => {
  const { t } = useTranslation()
  const { theme } = useTheme()

  const [selectedValue, setSelectedValue] = useState('')
  const [amount, setAmount] = useState('')
  const [recipient, setRecipient] = useState('')

  const resetForm = useCallback(() => {
    setSelectedValue('')
    setAmount('')
    setRecipient('')
  }, [])

  const handleChangeToken = useCallback((option: SelectValue) => {
    setSelectedValue(String(option.value))
  }, [])

  const selectedToken = useMemo(
    () => tokens.find((token) => token.value === selectedValue) || null,
    [tokens, selectedValue]
  )

  const parsedAmount = useMemo(() => {
    if (!selectedToken || !amount) return null

    try {
      return parseUnits(amount, selectedToken.decimals)
    } catch {
      // An in-progress entry like "0." is not an error worth showing; the button stays disabled.
      return null
    }
  }, [amount, selectedToken])

  const amountError = useMemo(() => {
    if (!selectedToken || parsedAmount === null) return ''
    if (parsedAmount <= 0n) return t('Enter an amount greater than zero.')

    if (parsedAmount > selectedToken.availableAmount)
      return t('You can withdraw at most {{max}} {{symbol}}.', {
        max: formatDecimals(
          Number(formatUnits(selectedToken.availableAmount, selectedToken.decimals)),
          'amount'
        ),
        symbol: selectedToken.symbol
      })

    return ''
  }, [selectedToken, parsedAmount, t])

  const recipientError = useMemo(() => {
    if (!recipient) return ''
    if (!isValidAddress(recipient)) return t('That does not look like a wallet address.')

    return ''
  }, [recipient, t])

  const canSubmit =
    !!selectedToken && parsedAmount !== null && !amountError && !recipientError && !!recipient

  const handleSubmit = useCallback(() => {
    if (!canSubmit || !selectedToken || parsedAmount === null) return

    onSubmit({
      chainId: selectedToken.chainId,
      tokenAddress: selectedToken.tokenAddress,
      amount: parsedAmount,
      recipient
    })

    resetForm()
    closeBottomSheet()
  }, [canSubmit, selectedToken, parsedAmount, recipient, onSubmit, resetForm, closeBottomSheet])

  return (
    <BottomSheet
      // Must stay fixed: BottomSheet feeds this into the `key` of its Modalize, so a changing id
      // remounts the sheet in the same commit the caller opened it - leaving the backdrop up and
      // the sheet itself gone until the next attempt.
      id="privacy-pools-action"
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
      backgroundColor="primaryBackground"
    >
      <ModalHeader title={t(FORM_COPY.title)} handleClose={closeBottomSheet} />
      <Text fontSize={14} color={theme.secondaryText} style={spacings.mbSm}>
        {t(FORM_COPY.description)}
      </Text>

      {!tokens.length && (
        <Alert size="sm" type="info" text={t(FORM_COPY.noTokensText)} style={spacings.mbSm} />
      )}

      <Select
        testID="privacy-pools-token-select-withdraw"
        label={t(FORM_COPY.tokenLabel)}
        options={tokens}
        value={selectedToken}
        setValue={handleChangeToken}
        disabled={!tokens.length}
        placeholder={t('Select a token')}
        searchPlaceholder={t('Token name or address...')}
        emptyListPlaceholderText={t('No tokens found.')}
        bottomSheetTitle={t(FORM_COPY.tokenLabel)}
        containerStyle={spacings.mbSm}
      />

      <NumberInput
        label={t('Amount')}
        placeholder="0.0"
        value={amount}
        onChangeText={setAmount}
        precision={selectedToken?.decimals}
        error={amountError}
        disabled={!selectedToken}
        containerStyle={spacings.mbSm}
      />

      <Input
        label={t('Send to')}
        placeholder="0x..."
        value={recipient}
        onChangeText={setRecipient}
        error={recipientError}
        containerStyle={spacings.mbSm}
      />

      <Alert size="sm" type="info" text={t(FORM_COPY.note)} style={spacings.mbSm} />

      <View style={spacings.mbSm}>
        <Button
          testID="privacy-pools-submit-withdraw"
          text={t(FORM_COPY.submitText)}
          onPress={handleSubmit}
          disabled={!canSubmit}
          hasBottomSpacing={false}
        />
      </View>
    </BottomSheet>
  )
}

export default React.memo(PrivacyPoolsActionSheet)
