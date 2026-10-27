import React, { FC, useCallback, useMemo } from 'react'
import { TextStyle, View, ViewStyle } from 'react-native'

import { Account } from '@ambire-common/interfaces/account'
import { PrivacyPoolsRagequitDeposit } from '@ambire-common/interfaces/privacyPools'
import shortenAddress from '@ambire-common/utils/shortenAddress'
import ButtonWithLoader from '@common/components/ButtonWithLoader/ButtonWithLoader'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING, SPACING_SM } from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

/** A deposit as the Rage quit sheet lists it: with the wallet's account it came from, if any. */
export type RagequitDepositView = PrivacyPoolsRagequitDeposit & {
  /** The wallet's account the deposit came from, or null when it is not in the wallet. */
  account: Account | null
  isViewOnly: boolean
  /** What it gets back, formatted with the token's decimals and symbol. */
  amountFormatted: string
}

const ragequitButtonStyles: { container: ViewStyle; text: TextStyle } = {
  container: { width: 116, height: 40, paddingHorizontal: SPACING },
  text: { fontSize: 12, lineHeight: 24 }
}

/** The sides take the same share of the row, so the amount sits in its middle. */
const columnStyles: { from: ViewStyle; amount: ViewStyle; action: ViewStyle } = {
  from: { flex: 1, minWidth: 0 },
  amount: { width: 100, alignItems: 'center' },
  action: { flex: 1, alignItems: 'flex-end' }
}

/** One labelled value of the row, like "Amount: 50 USDT". */
const Column: FC<{ label: string; value: string; style: ViewStyle }> = ({
  label,
  value,
  style
}) => (
  <View style={style}>
    <Text fontSize={12} appearance="secondaryText" numberOfLines={1}>
      {label}
    </Text>
    <Text fontSize={14} weight="medium" numberOfLines={1}>
      {value}
    </Text>
  </View>
)

/**
 * One deposit that can be taken back, with the account it came from and goes back to, and its
 * own Rage quit. That is disabled when the account is not in the wallet or is
 * view-only, as nothing could sign for it; its tooltip says why.
 */
const RagequitDepositRow: FC<{
  deposit: RagequitDepositView
  onRagequit: (label: bigint) => void
  /** This row's rage quit is being prepared. */
  isSubmitting: boolean
  /** Another row's is, and only one runs at a time. */
  isDisabled: boolean
}> = ({ deposit, onRagequit, isSubmitting, isDisabled }) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const blockedReason = useMemo(() => {
    if (!deposit.account) return t('Add this account to your wallet to take this deposit back.')
    if (deposit.isViewOnly) return t('Import the key of this account to take this deposit back.')

    return null
  }, [deposit.account, deposit.isViewOnly, t])

  const handleRagequit = useCallback(() => onRagequit(deposit.label), [deposit.label, onRagequit])
  const labelString = deposit.label.toString()

  return (
    <View
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        spacings.phSm,
        spacings.pvSm,
        spacings.mbTy,
        {
          // The same space on both sides of the amount, so it stays centered
          gap: SPACING_SM,
          borderRadius: BORDER_RADIUS_PRIMARY,
          backgroundColor: theme.secondaryBackground
        }
      ]}
      testID={`privacy-pools-ragequit-deposit-${labelString}`}
    >
      <Column
        label={t('From:')}
        value={deposit.account?.preferences.label || shortenAddress(deposit.depositorAddr, 13)}
        style={columnStyles.from}
      />
      <Column label={t('Amount:')} value={deposit.amountFormatted} style={columnStyles.amount} />
      <View
        style={columnStyles.action}
        dataSet={
          blockedReason
            ? createGlobalTooltipDataSet({ id: `ragequit-${labelString}`, content: blockedReason })
            : undefined
        }
      >
        <ButtonWithLoader
          testID={`privacy-pools-ragequit-${labelString}`}
          type="danger"
          size="small"
          text={t('Quit')}
          isLoading={isSubmitting}
          spinnerVariant="danger"
          style={ragequitButtonStyles.container}
          textStyle={ragequitButtonStyles.text}
          disabled={!!blockedReason || isSubmitting || isDisabled}
          onPress={handleRagequit}
        />
      </View>
    </View>
  )
}

export default React.memo(RagequitDepositRow)
