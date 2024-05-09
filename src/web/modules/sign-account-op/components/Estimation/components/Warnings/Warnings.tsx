import React, { FC, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import Alert from '@common/components/Alert'
import Checkbox from '@common/components/Checkbox'
import NoKeysToSignAlert from '@common/components/NoKeysToSignAlert'
import Text from '@common/components/Text/'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useSignAccountOpControllerState from '@web/hooks/useSignAccountOpControllerState'

import getStyles from './styles'

interface Props {
  hasEstimation: boolean
  estimationFailed: boolean
  slowRequest: boolean
  isViewOnly: boolean
}

const EstimationWarnings: FC<Props> = ({
  hasEstimation,
  estimationFailed,
  slowRequest,
  isViewOnly
}) => {
  const { styles } = useTheme(getStyles)
  const { t } = useTranslation()
  const signAccountOpState = useSignAccountOpControllerState()
  const { dispatch } = useBackgroundService()

  const onGasUsedTooHighAgreed = useCallback(() => {
    dispatch({
      type: 'MAIN_CONTROLLER_SIGN_ACCOUNT_OP_UPDATE',
      params: { gasUsedTooHighAgreed: !signAccountOpState?.gasUsedTooHighAgreed }
    })
  }, [signAccountOpState?.gasUsedTooHighAgreed, dispatch])

  if (!signAccountOpState) return null

  return (
    <>
      {!!hasEstimation &&
        !estimationFailed &&
        signAccountOpState.gasUsedTooHigh &&
        !signAccountOpState?.errors.length && (
          <View style={styles.errorContainer}>
            <Alert
              type="warning"
              title="Estimation for this request is enormously high (more than 10 million gas units). There's a chance the transaction is invalid and it will revert. Are you sure you want to continue?"
            />
            <Checkbox
              value={signAccountOpState.gasUsedTooHighAgreed}
              onValueChange={onGasUsedTooHighAgreed}
              style={spacings.mtSm}
            >
              <Text fontSize={14} onPress={onGasUsedTooHighAgreed}>
                {t('I understand the risks')}
              </Text>
            </Checkbox>
          </View>
        )}

      {!hasEstimation && !!slowRequest && !signAccountOpState?.errors.length ? (
        <View style={styles.errorContainer}>
          <Alert
            type="warning"
            title="Estimating this transaction is taking an unexpectedly long time. We'll keep trying, but it is possible that there's an issue with this network or RPC - please change your RPC provider or contact Ambire support if this issue persists."
          />
        </View>
      ) : null}

      {!!signAccountOpState?.errors.length && !isViewOnly ? (
        <View style={styles.errorContainer}>
          <Alert type="error" title={signAccountOpState?.errors[0]} />
        </View>
      ) : null}
      {isViewOnly && <NoKeysToSignAlert />}
    </>
  )
}

export default EstimationWarnings
