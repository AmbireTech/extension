import React from 'react'
import { useTranslation } from 'react-i18next'

import { EstimationStatus } from '@ambire-common/controllers/estimation/types'
import { ISignAccountOpController } from '@ambire-common/interfaces/signAccountOp'
import Alert from '@common/components/Alert'
import useController from '@common/hooks/useController'
import spacings from '@common/styles/spacings'

const BundlerWarning = ({
  signAccountOpState,
  bundlerNonceDiscrepancy
}: {
  signAccountOpState: ISignAccountOpController | null
  bundlerNonceDiscrepancy?: {
    id: string
    title: string
  }
}) => {
  const { dispatch: signAccountOpDispatch } = useController('SignAccountOpController')
  const { dispatch: swapAndBridgeDispatch } = useController('SwapAndBridgeController')
  const { dispatch: transferDispatch } = useController('TransferController')
  const { t } = useTranslation()

  if (!bundlerNonceDiscrepancy || !signAccountOpState) return null

  return (
    <Alert
      type="warning"
      title={bundlerNonceDiscrepancy.title}
      style={spacings.mt}
      buttonProps={{
        type: 'warning',
        text: t('Retry'),
        onPress: () => {
          if (signAccountOpState.type === 'one-click-swap-and-bridge') {
            swapAndBridgeDispatch({
              type: 'method',
              params: {
                method: 'callSignAccountOpMethod',
                args: ['retry', ['simulate']]
              }
            })
          } else if (signAccountOpState.type === 'one-click-transfer') {
            transferDispatch({
              type: 'method',
              params: {
                method: 'callSignAccountOpMethod',
                args: ['retry', ['simulate']]
              }
            })
          } else {
            signAccountOpDispatch({
              type: 'method',
              params: {
                method: 'retry',
                args: ['simulate']
              }
            })
          }
        },
        disabled: signAccountOpState.estimation.status === EstimationStatus.Loading,
        size: 'small'
      }}
    />
  )
}

export default React.memo(BundlerWarning)
