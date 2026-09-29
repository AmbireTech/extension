import React, { useMemo } from 'react'
import { View } from 'react-native'

import WithdrawIcon from '@common/assets/svg/WithdrawIcon'
import Button from '@common/components/Button'
import HoverablePressable from '@common/components/HoverablePressable'
import Input from '@common/components/Input'
import SupportLink from '@common/components/SupportLink'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import { THEME_TYPES } from '@common/styles/themeConfig'

import getStyles from './styles'

import type { WalletStakingTxnIdLookupError } from '@ambire-common/controllers/walletToken/walletToken'

interface Props {
  isWithdrawalsLookupEnabled: boolean
  txnId: string
  onTxnIdChange: (txnId: string) => void
  onFindByTxnId: () => void
  txnIdLookupError: WalletStakingTxnIdLookupError | null
  isTxnIdLookupLoading: boolean
  onEnableWithdrawalsLookup: () => void
}

/**
 * Shown when the staking contract holds shares for a withdrawal we can't describe - the leave
 * event reaches us through the relayer's logs, which lag the transaction, and the stored copy is
 * gone (another device, or cleared storage). When the user turned the withdrawals lookup off in
 * the privacy settings, it lets them enter the ID of the unstake transaction, or turn the lookup
 * back on.
 */
const MissingWithdrawalDetails = ({
  isWithdrawalsLookupEnabled,
  txnId,
  onTxnIdChange,
  onFindByTxnId,
  txnIdLookupError,
  isTxnIdLookupLoading,
  onEnableWithdrawalsLookup
}: Props) => {
  const { t } = useTranslation()
  const { styles, theme, themeType } = useTheme(getStyles)

  const txnIdErrorMessage = useMemo(() => {
    if (txnIdLookupError === 'invalid') {
      return t('This is not a valid transaction ID. It starts with 0x and has 66 characters.')
    }
    if (txnIdLookupError === 'not-found') {
      return t('We couldn’t find a pending unstake of this account in this transaction.')
    }
    if (txnIdLookupError === 'failed') {
      return t('We couldn’t check this transaction. Please try again.')
    }

    return undefined
  }, [t, txnIdLookupError])

  return (
    <View style={styles.pendingWithdrawalCard}>
      <View style={styles.pendingWithdrawalIcon}>
        <WithdrawIcon width={54} height={54} color={theme.errorText} />
      </View>
      <Text fontSize={18} weight="semiBold" style={styles.pendingWithdrawalText}>
        {t('We couldn’t find your withdrawal details')}
      </Text>
      {isWithdrawalsLookupEnabled ? (
        <Text fontSize={13} appearance="secondaryText" style={styles.pendingWithdrawalDescription}>
          {t(
            'Your $WALLET is locked for a withdrawal, but we can’t load the details of it. If this doesn’t resolve on its own, please '
          )}
          <SupportLink fontSize={13} />
          {t(' and we will help.')}
        </Text>
      ) : (
        <>
          <Text
            fontSize={13}
            appearance="secondaryText"
            style={styles.pendingWithdrawalDescription}
          >
            {t(
              'You turned off pending withdrawal detection in the privacy settings, so enter the transaction ID of your unstake to find the details.'
            )}
          </Text>
          <View style={styles.missingDetailsForm}>
            <Input
              value={txnId}
              onChangeText={onTxnIdChange}
              onSubmitEditing={onFindByTxnId}
              placeholder={t('Transaction ID (0x...)')}
              autoCapitalize="none"
              autoCorrect={false}
              error={txnIdErrorMessage}
              containerStyle={styles.missingDetailsInput}
              // Without an error, the input's border would be transparent
              inputWrapperStyle={txnIdErrorMessage ? undefined : styles.missingDetailsInputWrapper}
            />
            <Button
              text={isTxnIdLookupLoading ? t('Finding...') : t('Find withdrawal')}
              onPress={onFindByTxnId}
              disabled={!txnId.trim() || isTxnIdLookupLoading}
              hasBottomSpacing={false}
            />
            <Text fontSize={13} appearance="secondaryText" style={styles.missingDetailsLookupText}>
              {t('…or ')}
              <HoverablePressable onPress={onEnableWithdrawalsLookup}>
                <Text
                  fontSize={13}
                  weight="medium"
                  color={themeType === THEME_TYPES.DARK ? theme.linkText : theme.primary}
                >
                  {t('enable lookup')}
                </Text>
              </HoverablePressable>
              {t(' via the Ambire API')}
            </Text>
          </View>
        </>
      )}
    </View>
  )
}

export default React.memo(MissingWithdrawalDetails)
