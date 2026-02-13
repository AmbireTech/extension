import React from 'react'
import { useTranslation } from 'react-i18next'

import { EstimationStatus } from '@ambire-common/controllers/estimation/types'
import { ISignAccountOpController } from '@ambire-common/interfaces/signAccountOp'
import Alert from '@common/components/Alert'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
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
  const { dispatch } = useControllersMiddleware()
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
          dispatch({
            type: 'CURRENT_SIGN_ACCOUNT_OP_REESTIMATE',
            params: {
              type: signAccountOpState.type
            }
          })
        },
        disabled: signAccountOpState.estimation.status === EstimationStatus.Loading,
        size: 'small'
      }}
    />
  )
}

export default React.memo(BundlerWarning)
