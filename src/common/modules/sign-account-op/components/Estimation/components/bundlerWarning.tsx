import React from 'react'
import { useTranslation } from 'react-i18next'

import { EstimationStatus } from '@ambire-common/controllers/estimation/types'
import { ISignAccountOpController } from '@ambire-common/interfaces/signAccountOp'
import RetryIcon from '@common/assets/svg/RetryIcon'
import Alert from '@common/components/Alert'
import useCallSignAccountOpMethod from '@common/hooks/useCallSignAccountOpMethod'
import spacings from '@common/styles/spacings'

const BundlerWarning = ({
  signAccountOpState,
  bundlerNonceDiscrepancy,
  hasMarginTop
}: {
  signAccountOpState: ISignAccountOpController | null
  bundlerNonceDiscrepancy?: {
    id: string
    title: string
    text?: string
  }
  hasMarginTop?: boolean
}) => {
  const callSignAccountOpMethod = useCallSignAccountOpMethod(signAccountOpState?.type)
  const { t } = useTranslation()

  if (!bundlerNonceDiscrepancy || !signAccountOpState) return null

  return (
    <Alert
      type="warning"
      title={bundlerNonceDiscrepancy.title}
      style={{ ...spacings.mbSm, ...(hasMarginTop ? spacings.mtSm : {}) }}
      text={bundlerNonceDiscrepancy.text || ''}
      isButtonTopRight
      buttonProps={{
        size: 'tiny',
        type: 'warning',
        text: t('Retry'),
        childrenPosition: 'left',
        children: <RetryIcon width={14} height={14} style={spacings.mrMi} />,
        onPress: () => {
          callSignAccountOpMethod('retry', ['simulate'])
        },
        disabled: signAccountOpState.estimation.status === EstimationStatus.Loading
      }}
    />
  )
}

export default React.memo(BundlerWarning)
