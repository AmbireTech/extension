import React, { FC } from 'react'
import { Pressable, View } from 'react-native'

import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { createTab } from '@web/extension-services/background/webapi/tab'

export type RouteItemType = {
  icon: any
  label: string
  route?: string
  disabled?: boolean
  onPress?: () => void
  testID?: string
  isExternal?: boolean
  scale: number
  scaleOnHover: number
  backgroundImage?: string
}

interface Props {
  routeItem: RouteItemType
  index: number
  routeItemsLength: number
}

const ITEM_HEIGHT = 44
const ICON_SIZE = 24

const RouteItem: FC<Props> = ({ routeItem, index, routeItemsLength }) => {
  const { theme, themeType } = useTheme()
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const { addToast } = useToast()

  return (
    <Pressable
      key={routeItem.label}
      style={[flexbox.alignCenter, index !== routeItemsLength - 1 && spacings.mrSm]}
      disabled={routeItem.disabled}
      onPress={async () => {
        if (routeItem?.onPress) {
          routeItem.onPress()
          return
        }

        if (routeItem.isExternal && routeItem.route) {
          try {
            await createTab(routeItem.route)
          } catch {
            addToast(t('Failed to open new tab.'), { type: 'error' })
          }
          return
        }
        if (!routeItem.route) return

        navigate(routeItem.route)
      }}
    >
      {({ hovered }: any) => (
        <>
          <View
            testID={routeItem.testID}
            style={{
              height: ITEM_HEIGHT,
              width: routeItem.route === WEB_ROUTES.swapAndBridge ? ITEM_HEIGHT * 2 : ITEM_HEIGHT,
              borderRadius: BORDER_RADIUS_PRIMARY,
              backgroundColor: hovered
                ? themeType === THEME_TYPES.DARK
                  ? '#1b2b2c'
                  : '#141833CC'
                : themeType === THEME_TYPES.DARK
                ? theme.primaryBackground
                : theme.primaryText,
              ...flexbox.center,
              ...spacings.mbTy,
              ...(routeItem.backgroundImage
                ? {
                    // @ts-ignore
                    backgroundImage: `url(${routeItem.backgroundImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }
                : {})
            }}
          >
            <View
              style={[
                flexbox.center,
                flexbox.alignCenter,
                routeItem.route === WEB_ROUTES.swapAndBridge && { width: 70, height: 24 }
              ]}
            >
              <routeItem.icon
                color={
                  themeType === THEME_TYPES.DARK
                    ? theme.primary
                    : hovered && !routeItem.backgroundImage
                    ? '#c197ff'
                    : theme.primaryBackground
                }
                // Rewards has no other hover effect so we slightly increase its size
                height={
                  routeItem.route === WEB_ROUTES.rewards && hovered ? ICON_SIZE + 2 : ICON_SIZE
                }
                width={
                  routeItem.route === WEB_ROUTES.rewards && hovered ? ICON_SIZE + 2 : ICON_SIZE
                }
              />
            </View>
          </View>
          <Text
            color={
              themeType === THEME_TYPES.DARK
                ? theme.primaryBackgroundInverted
                : theme.primaryBackground
            }
            weight="regular"
            fontSize={12}
            style={routeItem.disabled && { opacity: 0.4 }}
          >
            {routeItem.label}
          </Text>
        </>
      )}
    </Pressable>
  )
}

export default React.memo(RouteItem)
