import { useMemo } from 'react'

import { HARD_CODED_CURRENCY } from '@ambire-common/consts/swapAndBridge'
import { safeTokenAmountAndNumberMultiplication } from '@ambire-common/utils/numbers/formatters'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'
import type { EstimationServiceFee } from '@common/modules/sign-account-op/components/Estimation/types'

const selectPrivacyPoolsRecipient = (state: AllControllersMappingType['TransferController']) =>
  state.privacyPoolsRecipient
const selectPrivacyPoolsFeeAmount = (state: AllControllersMappingType['TransferController']) =>
  state.privacyPoolsFeeAmount
const selectSelectedToken = (state: AllControllersMappingType['TransferController']) =>
  state.selectedToken

/** The tooltip of the Privacy Pools fee of a deposit, the same wherever it shows. In English, to translate as it is. */
export const PRIVACY_POOLS_DEPOSIT_FEE_TOOLTIP =
  'Privacy Pools charges this fee on top of your deposit, so the whole amount you typed goes into your private account.'

/**
 * The Privacy Pools fee of a deposit into a Privacy Pools account, to show next to the network
 * fee. Undefined for other transfers and until the fee is read.
 */
const usePrivacyPoolsDepositFee = (): EstimationServiceFee | undefined => {
  const { t } = useTranslation()
  const { state: privacyPoolsRecipient } = useController(
    'TransferController',
    selectPrivacyPoolsRecipient
  )
  const { state: feeAmount } = useController('TransferController', selectPrivacyPoolsFeeAmount)
  const { state: token } = useController('TransferController', selectSelectedToken)

  return useMemo(() => {
    if (!privacyPoolsRecipient || !token || feeAmount === null) return undefined

    const price = token.priceIn.find(
      ({ baseCurrency }) => baseCurrency === HARD_CODED_CURRENCY
    )?.price

    return {
      amount: feeAmount.toString(),
      amountUSD: price
        ? safeTokenAmountAndNumberMultiplication(feeAmount, token.decimals, price)
        : '0',
      token,
      label: { title: t('Protocol fee'), tooltip: t(PRIVACY_POOLS_DEPOSIT_FEE_TOOLTIP) }
    }
  }, [feeAmount, privacyPoolsRecipient, t, token])
}

export default usePrivacyPoolsDepositFee
