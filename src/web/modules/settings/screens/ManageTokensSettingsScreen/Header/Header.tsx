import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import Text from '@common/components/Text'
import spacings from '@common/styles/spacings'

const Header = () => {
  const { t } = useTranslation()

  return (
    <View style={[{ maxWidth: 512 }, spacings.mbLg]}>
      <Text appearance="primaryText" fontSize={20} style={spacings.mbMi} weight="medium">
        {t('Custom and hidden assets')}
      </Text>
      <Text appearance="secondaryText" fontSize={14}>
        {t(
          'Manage your custom and hidden assets. These settings will be applied across all accounts.'
        )}
      </Text>
    </View>
  )
}

export default React.memo(Header)
