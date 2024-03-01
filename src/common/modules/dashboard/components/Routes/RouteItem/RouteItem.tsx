import React, { FC } from 'react'
import { Animated, Pressable, View } from 'react-native'

import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import {
  NEUTRAL_BACKGROUND,
  NEUTRAL_BACKGROUND_HOVERED
} from '@common/modules/dashboard/screens/styles'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { createTab } from '@web/extension-services/background/webapi/tab'
import { DURATIONS, useMultiHover } from '@web/hooks/useHover'

interface Props {
  routeItem: {
    icon: any
    label: string
    route?: string
    isExternal: boolean
    disabled?: boolean
    onPress?: () => void
  }
  index: number
  routeItemsLength: number
}

const RouteItem: FC<Props> = ({ routeItem, index, routeItemsLength }) => {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const { addToast } = useToast()
  const [bindAccountBtnAnim, accountBtnAnimStyle, isAccountBtnHovered] = useMultiHover({
    values: [
      {
        key: 'opacity',
        from: 0.7,
        to: 1
      },
      {
        key: 'scaleX',
        from: 1,
        to: 1.2,
        duration: DURATIONS.FAST
      }
    ]
  })

  return (
    <Pressable
      testID={'dashboard-button-' + routeItem.label.toLowerCase().replace(/\s+/g, '-')}
      key={routeItem.label}
      style={[flexbox.alignCenter, index !== routeItemsLength - 1 && spacings.mr]}
      disabled={routeItem.disabled}
      onPress={async () => {
        if (routeItem?.onPress) {
          routeItem.onPress()
          return
        }

        if (routeItem.isExternal) {
          try {
            await createTab(routeItem.route)
          } catch {
            addToast(t('Failed to open new tab.'), { type: 'error' })
          }
          return
        }
        navigate(routeItem.route)
      }}
      {...bindAccountBtnAnim}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: BORDER_RADIUS_PRIMARY,
          backgroundColor: isAccountBtnHovered ? NEUTRAL_BACKGROUND_HOVERED : NEUTRAL_BACKGROUND,
          ...flexbox.center,
          // opacity: routeItem.disabled ? 0.4 : 1,
          ...spacings.mbTy
        }}
      >
        <Animated.View
          style={{
            opacity: routeItem.disabled ? 0.4 : accountBtnAnimStyle.opacity,
            transform: [{ scale: accountBtnAnimStyle.scaleX as number }]
          }}
        >
          <routeItem.icon color={theme.primaryBackground} width={26} height={26} />
        </Animated.View>
      </View>
      <Text
        color={theme.primaryBackground}
        weight="regular"
        fontSize={12}
        style={routeItem.disabled && { opacity: 0.4 }}
      >
        {routeItem.label}
      </Text>
    </Pressable>
  )
}

export default RouteItem
