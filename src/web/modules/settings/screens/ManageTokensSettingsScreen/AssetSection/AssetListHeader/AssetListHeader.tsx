import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import Text from '@common/components/Text'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  /** The label of the first column. Defaults to 'Token' */
  assetLabel?: string
}

const AssetListHeader = ({ assetLabel = 'Token' }: Props) => {
  const { t } = useTranslation()
  return (
    <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.pvMi]}>
      <View style={{ flex: 1.25, ...spacings.plSm }}>
        <Text appearance="secondaryText" fontSize={14}>
          {t(assetLabel)}
        </Text>
      </View>
      <View style={{ flex: 1.5 }}>
        <Text appearance="secondaryText" fontSize={14}>
          {t('Network')}
        </Text>
      </View>
      <View
        style={{ flex: 0.4, ...flexbox.directionRow, ...flexbox.alignCenter, ...spacings.prSm }}
      >
        <Text appearance="secondaryText" fontSize={14}>
          {t('Manage')}
        </Text>
      </View>
    </View>
  )
}

export default AssetListHeader
