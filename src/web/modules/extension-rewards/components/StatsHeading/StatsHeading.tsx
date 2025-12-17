import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import Text from '@common/components/Text'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

const StatsHeading = () => {
  const { t } = useTranslation()
  return (
    <View
      style={{
        ...flexbox.directionRow,
        ...flexbox.alignCenter,
        ...spacings.mbSm
      }}
    >
      <Text
        fontSize={13}
        weight="medium"
        color="#8E98A8"
        style={{
          flex: 0.2
        }}
      >
        {t('Score')}
      </Text>
      <Text
        fontSize={13}
        weight="medium"
        color="#8E98A8"
        style={{
          flex: 0.6
        }}
      >
        {t('Criteria')}
      </Text>
      <Text
        fontSize={13}
        weight="medium"
        color="#8E98A8"
        style={{
          flex: 0.2,
          textAlign: 'right'
        }}
      >
        {t('Amount')}
      </Text>
    </View>
  )
}

export default StatsHeading
