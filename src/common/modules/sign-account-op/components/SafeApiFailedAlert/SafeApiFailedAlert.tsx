import React, { useMemo } from 'react'
import { ViewStyle } from 'react-native'

import Alert from '@common/components/Alert'
import { useTranslation } from '@common/config/localization'
import useSafeApiSetting from '@common/hooks/useSafeApiSetting'

/**
 * Shown when a Safe transaction or signature didn't reach the other owners: either the user
 * opted out of the Safe API ("Sync Safe accounts" in the privacy settings) or the request failed.
 */
const SafeApiFailedAlert = ({ style }: { style?: ViewStyle }) => {
  const { t } = useTranslation()
  const { isSafeApiEnabled } = useSafeApiSetting()

  const copy = useMemo(() => {
    if (!isSafeApiEnabled)
      return {
        title: t('Safe accounts sync is turned off'),
        text: t(
          'You turned off "Sync Safe accounts" in the privacy settings, so the other owners will not see this transaction or your signature.'
        )
      }

    return {
      title: t('Safe API failure'),
      text: t('Transaction was not sent to Safe Global due to a Safe API failure')
    }
  }, [isSafeApiEnabled, t])

  return <Alert size="sm" type="warning" title={copy.title} text={copy.text} style={style} />
}

export default React.memo(SafeApiFailedAlert)
