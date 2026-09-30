import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import Badge from '@common/components/Badge'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import useCompactLayout from '@common/hooks/useCompactLayout'
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
  const { isTwoColumnLayout } = useCompactLayout()
  // In a single column the card fits its content and shrinks (scrolling the features) only
  // when there is not enough space, instead of stretching to the bottom of the screen
  const sizingStyle = isTwoColumnLayout ? flexbox.flex1 : { flexShrink: 1 }

  return (
    <View
      style={[
        !!children && sizingStyle,
        common.borderRadiusPrimary,
        isTwoColumnLayout && { maxHeight: 308 }
      ]}
    >
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
          },
          !children && {
            borderBottomLeftRadius: BORDER_RADIUS_PRIMARY,
            borderBottomRightRadius: BORDER_RADIUS_PRIMARY
          }
        ]}
      >
        <View style={flexbox.flex1}>
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
            // Wrap the full URL instead of truncating it, so the user sees exactly what they approve
            style={[
              spacings.mtTy,
              isWeb && {
                // @ts-ignore web-only style for wrapping long URLs without spaces
                wordBreak: 'break-all'
              }
            ]}
          >
            {url}
          </Text>
        </View>
        {isNew && <Badge type="new" text={t('New')} />}
      </View>
      {!!children && (
        <View
          style={[
            spacings.phSm,
            spacings.pvMd,
            sizingStyle,
            {
              backgroundColor: isNew ? theme.success100 : theme.secondaryBackground,
              borderBottomLeftRadius: BORDER_RADIUS_PRIMARY,
              borderBottomRightRadius: BORDER_RADIUS_PRIMARY
            }
          ]}
        >
          {children}
        </View>
      )}
    </View>
  )
}

export default React.memo(RpcCard)
