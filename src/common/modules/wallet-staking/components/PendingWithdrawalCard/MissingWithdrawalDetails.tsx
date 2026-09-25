import React, { useMemo } from 'react'
import { View } from 'react-native'

import LockWithTimerIcon from '@common/assets/svg/LockWithTimerIcon'
import Button from '@common/components/Button'
import Input from '@common/components/Input'
import SupportLink from '@common/components/SupportLink'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'

import getStyles from './styles'

import type { WithdrawalTxnIdLookupError } from '@common/modules/wallet-staking/hooks/usePendingWalletWithdrawal'

interface Props {
  isWithdrawalsLookupEnabled: boolean
  txnId: string
  onTxnIdChange: (txnId: string) => void
  onFindByTxnId: () => void
  txnIdLookupError: WithdrawalTxnIdLookupError | null
  onEnableWithdrawalsLookup: () => void
}

/**
 * Shown when the staking contract holds shares for a withdrawal we can't describe - the leave
 * event reaches us through the relayer's logs, which lag the transaction, and the cached copy is
 * gone (another device, or cleared storage). When the user opted out of the relayer lookup, it
 * lets them enter the ID of the unstake transaction, or turn the lookup back on.
 */
const MissingWithdrawalDetails = ({
  isWithdrawalsLookupEnabled,
  txnId,
  onTxnIdChange,
  onFindByTxnId,
  txnIdLookupError,
  onEnableWithdrawalsLookup
}: Props) => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)

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
        <LockWithTimerIcon width={54} height={54} color={theme.errorText} />
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
              'Your $WALLET is locked for a withdrawal. To protect your privacy, we only checked the transactions made from this device. Enter the transaction ID of your unstake to find the details.'
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
            />
            <Button
              text={t('Find withdrawal')}
              onPress={onFindByTxnId}
              disabled={!txnId.trim()}
              hasBottomSpacing={false}
            />
          </View>
          <View style={styles.missingDetailsForm}>
            <Text fontSize={13} appearance="secondaryText" style={styles.missingDetailsWarning}>
              {t(
                'Or let Ambire find it for you. This reduces your privacy, because it sends your current account address to Ambire.'
              )}
            </Text>
            <Button
              text={t('Find it automatically')}
              type="secondary"
              onPress={onEnableWithdrawalsLookup}
              hasBottomSpacing={false}
            />
          </View>
        </>
      )}
    </View>
  )
}

export default React.memo(MissingWithdrawalDetails)
