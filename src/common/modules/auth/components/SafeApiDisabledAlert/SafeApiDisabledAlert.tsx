import React from 'react'
import { ViewStyle } from 'react-native'

import Alert from '@common/components/Alert'
import { useTranslation } from '@common/config/localization'
import useSafeApiSetting from '@common/hooks/useSafeApiSetting'

/**
 * Shown on the Safe import screens while the user has opted out of the Safe API ("Sync Safe
 * accounts" in the privacy settings), which the import needs. Turning it back on lets the
 * import continue right away.
 */
const SafeApiDisabledAlert = ({ style }: { style?: ViewStyle }) => {
  const { t } = useTranslation()
  const { enableSafeApi } = useSafeApiSetting()

  return (
    <Alert
      type="info"
      isTypeLabelHidden
      style={style}
      title={t('Safe accounts sync is turned off')}
      titleWeight="semiBold"
      text={t(
        'You turned off "Sync Safe accounts" in the privacy settings. Turn it on to find and import your Safe accounts.'
      )}
      buttonProps={{ text: t('Turn on'), onPress: enableSafeApi }}
    />
  )
}

export default React.memo(SafeApiDisabledAlert)
