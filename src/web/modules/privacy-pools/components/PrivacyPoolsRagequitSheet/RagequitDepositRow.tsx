import React, { FC, useCallback, useMemo } from 'react'
import { View } from 'react-native'

import { Account } from '@ambire-common/interfaces/account'
import { PrivacyPoolsRagequitDeposit } from '@ambire-common/interfaces/privacyPools'
import shortenAddress from '@ambire-common/utils/shortenAddress'
import Avatar from '@common/components/Avatar'
import ButtonWithLoader from '@common/components/ButtonWithLoader/ButtonWithLoader'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
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

/** The account a deposit goes back to: its avatar, name and address. */
const RagequitAccount: FC<{ deposit: RagequitDepositView }> = ({ deposit }) => {
  const { t } = useTranslation()
  const { account, depositorAddr } = deposit

  return (
    <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.flex1]}>
      <Avatar
        pfp={account?.preferences.pfp || depositorAddr}
        address={depositorAddr}
        size={32}
        displayTypeBadge={false}
        style={spacings.mrTy}
      />
      <View style={flexbox.flex1}>
        <Text fontSize={14} weight="semiBold" numberOfLines={1}>
          {account?.preferences.label || t('Account not in this wallet')}
        </Text>
        <Text fontSize={12} appearance="secondaryText" numberOfLines={1}>
          {shortenAddress(depositorAddr, 13)}
        </Text>
      </View>
    </View>
  )
}

/**
 * One deposit that can be taken back, with its own Rage quit button. Without one when its account
 * is not in the wallet or is view-only, as nothing could sign for it; the row says why.
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

  return (
    <View
      style={[
        spacings.phSm,
        spacings.pvSm,
        spacings.mbTy,
        { borderRadius: BORDER_RADIUS_PRIMARY, backgroundColor: theme.secondaryBackground }
      ]}
      testID={`privacy-pools-ragequit-deposit-${deposit.label.toString()}`}
    >
      <View style={[flexbox.directionRow, flexbox.alignCenter]}>
        <RagequitAccount deposit={deposit} />
        <Text fontSize={14} weight="number_bold" style={spacings.mhSm}>
          {deposit.amountFormatted}
        </Text>
        {!blockedReason && (
          <ButtonWithLoader
            testID={`privacy-pools-ragequit-${deposit.label.toString()}`}
            type="danger"
            size="small"
            text={isSubmitting ? t('Preparing...') : t('Rage quit')}
            isLoading={isSubmitting}
            disabled={isSubmitting || isDisabled}
            onPress={handleRagequit}
            hasBottomSpacing={false}
          />
        )}
      </View>
      {!!blockedReason && (
        <Text fontSize={12} appearance="warningText" style={spacings.mtTy}>
          {blockedReason}
        </Text>
      )}
    </View>
  )
}

export default React.memo(RagequitDepositRow)
