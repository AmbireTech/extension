import { formatUnits, parseUnits } from 'ethers'
import React, { FC, useCallback, useMemo, useState } from 'react'
import { View } from 'react-native'

import { PrivacyPoolsWithdrawalMode } from '@ambire-common/interfaces/privacyPools'
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
import Toggle from '@common/components/Toggle'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { PrivacyPoolsTokenOption } from '@web/modules/privacy-pools/hooks/usePrivacyPoolsTokens/usePrivacyPoolsTokens'
import { PrivacyPoolsActionMode } from '@web/modules/privacy-pools/types'

export type PrivacyPoolsActionSubmitParams = {
  // The pool the action runs against, taken from the selected token rather than from a screen-wide
  // network selection - each chain has its own pools and entrypoint.
  chainId: string
  tokenAddress: string
  amount: bigint
  recipient: string
  mode: PrivacyPoolsWithdrawalMode
}

interface Props {
  mode: PrivacyPoolsActionMode
  tokens: PrivacyPoolsTokenOption[]
  sheetRef: React.RefObject<any>
  closeBottomSheet: () => void
  onSubmit: (params: PrivacyPoolsActionSubmitParams) => void
}

const MODE_CONFIG: {
  [mode in PrivacyPoolsActionMode]: {
    title: string
    description: string
    submitText: string
    tokenLabel: string
    noTokensText: string
    hasRecipient: boolean
    note: string
  }
} = {
  deposit: {
    title: 'Deposit',
    description: 'Move funds from your account into a Privacy Pool.',
    submitText: 'Deposit',
    tokenLabel: 'Token',
    noTokensText:
      'No tokens with a balance on the networks Privacy Pools supports. Fund your account first.',
    hasRecipient: false,
    // The one thing about depositing that surprises people, and it cannot be undone once the funds
    // are in: the deposit itself hides nothing.
    note: 'Everyone can see this deposit, including which address made it. What stays private is which deposit a later withdrawal comes from - so withdraw to a different address, and wait a while before you do.'
  },
  withdraw: {
    title: 'Withdraw',
    description: 'Take funds out of the pools, to any address you choose.',
    submitText: 'Prepare withdrawal',
    tokenLabel: 'Pooled token',
    noTokensText:
      'Nothing can be withdrawn yet. Either you have not deposited, or your deposits are still waiting to be approved.',
    hasRecipient: true,
    note: 'Nothing is sent until you confirm. Preparing takes about ten seconds - the fee and the exact amount are shown before anything leaves the pool.'
  }
}

/**
 * The deposit and withdraw forms.
 *
 * One sheet for both, because only one can be open at a time and they differ by `mode`. The network
 * comes from the selected token rather than from a separate dropdown - a token and the pool it sits
 * in are one choice, not two.
 */
const PrivacyPoolsActionSheet: FC<Props> = ({
  mode,
  tokens,
  sheetRef,
  closeBottomSheet,
  onSubmit
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const config = MODE_CONFIG[mode]

  const [selectedValue, setSelectedValue] = useState('')
  const [amount, setAmount] = useState('')
  const [recipient, setRecipient] = useState('')
  const [isSelfRelay, setIsSelfRelay] = useState(false)

  const resetForm = useCallback(() => {
    setSelectedValue('')
    setAmount('')
    setRecipient('')
    setIsSelfRelay(false)
  }, [])

  // One sheet serves both actions, so switching mode has to clear what the previous one was filled
  // with - a pooled balance is not a valid amount for a deposit, and a deposit has no recipient.
  // Adjusted during render rather than in an effect, which is what React recommends for "reset
  // state when a prop changes": the discarded values never reach the screen, and no second commit
  // is needed to clear them.
  const [renderedMode, setRenderedMode] = useState(mode)
  if (renderedMode !== mode) {
    setRenderedMode(mode)
    resetForm()
  }

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
      return mode === 'deposit'
        ? t('You have {{max}} {{symbol}} on this network.', {
            max: formatDecimals(
              Number(formatUnits(selectedToken.availableAmount, selectedToken.decimals)),
              'amount'
            ),
            symbol: selectedToken.symbol
          })
        : t('You can withdraw at most {{max}} {{symbol}}.', {
            max: formatDecimals(
              Number(formatUnits(selectedToken.availableAmount, selectedToken.decimals)),
              'amount'
            ),
            symbol: selectedToken.symbol
          })

    if (selectedToken.maxDeposit !== null && parsedAmount > selectedToken.maxDeposit)
      return t('The most you can deposit at once is {{max}} {{symbol}}.', {
        max: formatDecimals(
          Number(formatUnits(selectedToken.maxDeposit, selectedToken.decimals)),
          'amount'
        ),
        symbol: selectedToken.symbol
      })

    return ''
  }, [selectedToken, parsedAmount, mode, t])

  const recipientError = useMemo(() => {
    if (!config.hasRecipient || !recipient) return ''
    if (!isValidAddress(recipient)) return t('That does not look like a wallet address.')

    return ''
  }, [config.hasRecipient, recipient, t])

  const canSubmit =
    !!selectedToken &&
    parsedAmount !== null &&
    !amountError &&
    !recipientError &&
    (!config.hasRecipient || !!recipient)

  const handleSubmit = useCallback(() => {
    if (!canSubmit || !selectedToken || parsedAmount === null) return

    onSubmit({
      chainId: selectedToken.chainId,
      tokenAddress: selectedToken.tokenAddress,
      amount: parsedAmount,
      recipient,
      mode: isSelfRelay ? 'self' : 'relayed'
    })

    resetForm()
    closeBottomSheet()
  }, [
    canSubmit,
    selectedToken,
    parsedAmount,
    recipient,
    isSelfRelay,
    onSubmit,
    resetForm,
    closeBottomSheet
  ])

  return (
    <BottomSheet
      // Must not vary with `mode`: BottomSheet feeds this into the `key` of its Modalize, so a
      // per-mode id remounts the sheet in the same commit the caller opened it - leaving the
      // backdrop up and the sheet itself gone until the next attempt.
      id="privacy-pools-action"
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
      backgroundColor="primaryBackground"
    >
      <ModalHeader title={t(config.title)} handleClose={closeBottomSheet} />
      <Text fontSize={14} color={theme.secondaryText} style={spacings.mbSm}>
        {t(config.description)}
      </Text>

      {!tokens.length && (
        <Alert size="sm" type="info" text={t(config.noTokensText)} style={spacings.mbSm} />
      )}

      <Select
        testID={`privacy-pools-token-select-${mode}`}
        label={t(config.tokenLabel)}
        options={tokens}
        value={selectedToken}
        setValue={handleChangeToken}
        disabled={!tokens.length}
        placeholder={t('Select a token')}
        searchPlaceholder={t('Token name or address...')}
        emptyListPlaceholderText={t('No tokens found.')}
        bottomSheetTitle={t(config.tokenLabel)}
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

      {config.hasRecipient && (
        <Input
          label={t('Send to')}
          placeholder="0x..."
          value={recipient}
          onChangeText={setRecipient}
          error={recipientError}
          containerStyle={spacings.mbSm}
        />
      )}

      {config.hasRecipient && (
        <View style={spacings.mbSm}>
          <Toggle
            isOn={isSelfRelay}
            onToggle={setIsSelfRelay}
            label={t('Send it myself, without a relayer')}
          />
        </View>
      )}

      {/* The trap this toggle sets is not obvious from its label: paying the gas yourself is what
      puts your own address next to the recipient, which is the exact link the pool exists to
      break. */}
      {config.hasRecipient && isSelfRelay && (
        <Alert
          type="warning"
          size="sm"
          title={t('This links your wallet to the receiving address')}
          text={t(
            'Sending it yourself means paying the gas from one of your own addresses, which puts it on the blockchain next to the address you are withdrawing to. Use it to move funds back to an address already known to be yours, or when no relayer will take the withdrawal - not as a cheaper way to reach a fresh address.'
          )}
          style={spacings.mbSm}
        />
      )}

      <Alert size="sm" type="info" text={t(config.note)} style={spacings.mbSm} />

      <View style={spacings.mbSm}>
        <Button
          testID={`privacy-pools-submit-${mode}`}
          text={t(config.submitText)}
          onPress={handleSubmit}
          disabled={!canSubmit}
          hasBottomSpacing={false}
        />
      </View>
    </BottomSheet>
  )
}

export default React.memo(PrivacyPoolsActionSheet)
