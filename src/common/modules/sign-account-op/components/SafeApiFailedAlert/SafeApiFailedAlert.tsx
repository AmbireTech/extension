import React from 'react'
import { ViewStyle } from 'react-native'

import Alert from '@common/components/Alert'
import { useTranslation } from '@common/config/localization'
import useSafeApiSetting from '@common/hooks/useSafeApiSetting'

/**
 * Shown when a Safe transaction or signature didn't reach the other owners because the request
 * to the Safe API failed. Not while the user opted out of the Safe API ("Sync Safe accounts" in
 * the privacy settings), as nothing is sent to it then by their own choice.
 */
const SafeApiFailedAlert = ({ style }: { style?: ViewStyle }) => {
  const { t } = useTranslation()
  const { isSafeApiEnabled } = useSafeApiSetting()

  if (!isSafeApiEnabled) return null

  return (
    <Alert
      size="sm"
      type="warning"
      title={t('Safe API failure')}
      text={t('Transaction was not sent to Safe Global due to a Safe API failure')}
      style={style}
    />
  )
}

export default React.memo(SafeApiFailedAlert)
