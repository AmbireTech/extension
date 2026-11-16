import React, { useCallback, useMemo } from 'react'

import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import Alert from '@common/components/Alert'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useToast from '@common/hooks/useToast'
import useBorrowedFundsPreference from '@common/modules/dashboard/hooks/useBorrowedFundsPreference'
import spacings from '@common/styles/spacings'
import { privateValue } from '@common/utils/ui'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectBorrowedBalance = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.portfolio.borrowedBalance
const selectTotalBalance = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.portfolio.totalBalance
const selectIsPrivacyModeEnabled = (state: AllControllersMappingType['WalletStateController']) =>
  state.isPrivacyModeEnabled

/**
 * Asks the user, with their own numbers, whether the total balance should subtract the money
 * they borrowed. Render it only while they haven't chosen, as the choice moves to Settings.
 */
const BorrowedFundsAlert = () => {
  const { t } = useTranslation()
  const { state: borrowedBalance } = useController(
    'SelectedAccountController',
    selectBorrowedBalance
  )
  const { state: totalBalance } = useController('SelectedAccountController', selectTotalBalance)
  const { state: isPrivacyModeEnabled } = useController(
    'WalletStateController',
    selectIsPrivacyModeEnabled
  )
  const { addToast } = useToast()
  const { setBorrowedFundsPreference } = useBorrowedFundsPreference()

  const subtract = useCallback(() => {
    setBorrowedFundsPreference('subtract')
    addToast(t('Loans are now subtracted from your balance. You can change this in Settings.'), {
      type: 'success'
    })
  }, [addToast, setBorrowedFundsPreference, t])
  const include = useCallback(() => {
    setBorrowedFundsPreference('include')
    addToast(t('Loans stay in your balance. You can change this in Settings.'), {
      type: 'success'
    })
  }, [addToast, setBorrowedFundsPreference, t])

  const buttonProps = useMemo(
    () => ({ text: t('Subtract loans'), onPress: subtract }),
    [subtract, t]
  )
  const secondaryButtonProps = useMemo(
    () => ({ text: t('Keep as is'), onPress: include }),
    [include, t]
  )

  return (
    <Alert
      type="info"
      size="sm"
      style={spacings.mbSm}
      title={t('Subtract loans from your balance?')}
      text={t(
        'Your balance of {{total}} includes {{borrowed}} you borrowed in apps like Aave. Without it, your balance is {{net}}. You can change this later in Settings.',
        {
          total: privateValue(formatDecimals(totalBalance, 'value'), isPrivacyModeEnabled),
          borrowed: privateValue(formatDecimals(borrowedBalance, 'value'), isPrivacyModeEnabled),
          net: privateValue(
            formatDecimals(totalBalance - borrowedBalance, 'value'),
            isPrivacyModeEnabled
          )
        }
      )}
      buttonProps={buttonProps}
      secondaryButtonProps={secondaryButtonProps}
      testID="borrowed-funds-alert"
    />
  )
}

export default React.memo(BorrowedFundsAlert)
