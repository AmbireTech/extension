import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import Text from '@common/components/Text'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import useBackgroundService from '@web/hooks/useBackgroundService'

import { EstimationStatus } from '@ambire-common/controllers/estimation/types'
import { ISignAccountOpController } from '@ambire-common/interfaces/signAccountOp'
import Button from '@common/components/Button'

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
  const { dispatch } = useBackgroundService()
  const { t } = useTranslation()

  if (!bundlerNonceDiscrepancy || !signAccountOpState) return null

  return (
    <View
      style={[flexbox.directionRow, spacings.mt, flexbox.alignCenter, flexbox.justifySpaceBetween]}
    >
      <Text fontSize={12} appearance="warningText">
        {t(bundlerNonceDiscrepancy.title)}
      </Text>
      <Button
        type="warning"
        text={t('Retry')}
        onPress={() => {
          dispatch({
            type: 'SIGN_ACCOUNT_OP_REESTIMATE',
            params: {
              type: signAccountOpState.type
            }
          })
        }}
        disabled={signAccountOpState.estimation.status === EstimationStatus.Loading}
        hasBottomSpacing={false}
        size="tiny"
        style={{ width: 98 }}
      />
    </View>
  )
}

export default React.memo(BundlerWarning)
