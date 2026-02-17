import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import StarsIcon from '@common/assets/svg/StarsIcon'
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
    <View style={[flexbox.flex1, common.borderRadiusPrimary, { maxHeight: 308 }]}>
      <View
        style={[
          flexbox.directionRow,
          flexbox.justifySpaceBetween,
          spacings.phSm,
          spacings.pvTy,
          {
            borderTopLeftRadius: BORDER_RADIUS_PRIMARY,
            borderTopRightRadius: BORDER_RADIUS_PRIMARY,
            backgroundColor: isNew ? theme.success500 : theme.tertiaryBackground
          }
        ]}
      >
        <View>
          <Text
            fontSize={14}
            color={isNew ? theme.neutral100 : theme.tertiaryText}
            weight="semiBold"
          >
            {title}
          </Text>
          <Text
            fontSize={14}
            weight="semiBold"
            color={isNew ? theme.neutral100 : theme.primaryText}
            style={[spacings.mtTy, { maxWidth: 250 }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {url}
          </Text>
        </View>
        {isNew && (
          <View
            style={{
              height: 20,
              ...flexbox.directionRow,
              ...flexbox.alignCenter,
              ...spacings.plTy,
              ...spacings.prMi,
              borderRadius: 64,
              backgroundColor: theme.success200,
              borderWidth: 1,
              borderColor: theme.neutral400
            }}
          >
            <Text fontSize={10} weight="medium" style={spacings.mrMi} color={theme.neutral400}>
              {t('New')}
            </Text>
            <StarsIcon width={12} height={12} color={theme.neutral400} />
          </View>
        )}
      </View>
      <View
        style={[
          spacings.phSm,
          spacings.pvMd,
          flexbox.flex1,
          {
            backgroundColor: isNew ? theme.success100 : theme.secondaryBackground,
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
