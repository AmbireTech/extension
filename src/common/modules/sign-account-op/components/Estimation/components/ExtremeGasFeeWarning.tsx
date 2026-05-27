import React from 'react'
import { useTranslation } from 'react-i18next'

import Alert from '@common/components/Alert'
import useExtremeGasFeeWarning from '@common/hooks/useExtremeGasFeeWarning'
import spacings from '@common/styles/spacings'

import { ISignAccountOpController } from '@ambire-common/interfaces/signAccountOp'

const ExtremeGasFeeWarning = ({
  signAccountOpState,
  networkChainId
}: {
  signAccountOpState: ISignAccountOpController | null
  networkChainId?: bigint
}) => {
  const { t } = useTranslation()
  const { warningState } = useExtremeGasFeeWarning(signAccountOpState, networkChainId)

  if (!warningState) return null

  return (
    <Alert
      type="error"
      size="md"
      title={t('Unusually high network fee')}
      text={t(
        'This transaction fee is about {{feeUsd}} USD, which is higher than the usual {{thresholdUsd}} USD limit for this network. Please review before continuing.',
        {
          feeUsd: warningState.feeUsd.toFixed(2),
          thresholdUsd: warningState.thresholdUsd
        }
      )}
      style={spacings.mbSm}
      testID="extreme-gas-fee-warning"
    />
  )
}

export default React.memo(ExtremeGasFeeWarning)
