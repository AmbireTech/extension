import React from 'react'
import { useTranslation } from 'react-i18next'

import { EstimationStatus } from '@ambire-common/controllers/estimation/types'
import { ISignAccountOpController } from '@ambire-common/interfaces/signAccountOp'
import RetryIcon from '@common/assets/svg/RetryIcon'
import Alert from '@common/components/Alert'
import type { Props as EstimationProps } from '@common/modules/sign-account-op/components/Estimation/types'
import useSignAccountOpMethodDispatch from '@common/modules/sign-account-op/hooks/useSignAccountOpMethodDispatch'
import spacings from '@common/styles/spacings'

const BundlerWarning = ({
  signAccountOpState,
  bundlerNonceDiscrepancy,
  updateType,
  hasMarginTop
}: {
  signAccountOpState: ISignAccountOpController | null
  bundlerNonceDiscrepancy?: {
    id: string
    title: string
    text?: string
  }
  updateType: EstimationProps['updateType']
  hasMarginTop?: boolean
}) => {
  const dispatchSignAccountOpMethod = useSignAccountOpMethodDispatch(updateType)
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
        onPress: () => dispatchSignAccountOpMethod('retry', ['simulate']),
        disabled: signAccountOpState.estimation.status === EstimationStatus.Loading
      }}
    />
  )
}

export default React.memo(BundlerWarning)
