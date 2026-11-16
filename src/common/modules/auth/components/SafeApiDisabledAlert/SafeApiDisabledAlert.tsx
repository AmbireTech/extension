import React from 'react'
import { ViewStyle } from 'react-native'

import Alert from '@common/components/Alert'
import { useTranslation } from '@common/config/localization'
import useSafeApiSetting from '@common/hooks/useSafeApiSetting'

/**
 * Shown while the user has opted out of the Safe API ("Sync Safe accounts" in the privacy
 * settings) where it's needed: on the Safe import screens, and when signing needs owners on
 * other devices. Turning it back on lets the user continue right away.
 */
const SafeApiDisabledAlert = ({
  text,
  style
}: {
  /** Why sync is needed here. By default, for importing Safe accounts */
  text?: string
  style?: ViewStyle
}) => {
  const { t } = useTranslation()
  const { enableSafeApi } = useSafeApiSetting()

  return (
    <Alert
      type="info"
      isTypeLabelHidden
      style={style}
      title={t('Safe accounts sync is turned off')}
      titleWeight="semiBold"
      text={
        text ||
        t(
          'You turned off "Sync Safe accounts" in the privacy settings. Turn it on to find and import your Safe accounts.'
        )
      }
      buttonProps={{ text: t('Turn on'), onPress: enableSafeApi }}
    />
  )
}

export default React.memo(SafeApiDisabledAlert)
