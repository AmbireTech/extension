import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import Badge from '@common/components/Badge'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import common, { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

const RpcCard = ({
  title,
  url,
  isNew,
  children
}: {
  title: string
  url: string
  isNew?: boolean
  children: React.ReactNode
}) => {
  const { theme } = useTheme()
  const { t } = useTranslation()
  return (
    <View
      style={[
        flexbox.flex1,
        common.borderRadiusPrimary,
        isNew && common.shadowTertiary,
        { maxHeight: 308 }
      ]}
    >
      <View
        style={[
          flexbox.directionRow,
          flexbox.justifySpaceBetween,
          spacings.ph,
          spacings.pv,
          {
            borderTopLeftRadius: BORDER_RADIUS_PRIMARY,
            borderTopRightRadius: BORDER_RADIUS_PRIMARY,
            backgroundColor: theme.primaryBackground
          }
        ]}
      >
        <View>
          <Text fontSize={14} appearance="tertiaryText" weight="medium">
            {title}
          </Text>
          <Text
            fontSize={14}
            weight="medium"
            appearance={isNew ? 'successText' : 'primaryText'}
            style={[spacings.mtTy, { maxWidth: 250 }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {url}
          </Text>
        </View>
        {isNew && <Badge text={t('new')} type="success" />}
      </View>
      <View
        style={[
          spacings.ph,
          spacings.pv,
          flexbox.flex1,
          {
            backgroundColor: isNew ? theme.featureBackground : theme.secondaryBackground,
            borderBottomLeftRadius: BORDER_RADIUS_PRIMARY,
            borderBottomRightRadius: BORDER_RADIUS_PRIMARY
          }
        ]}
      >
        {children}
      </View>
    </View>
  )
}

export default React.memo(RpcCard)
