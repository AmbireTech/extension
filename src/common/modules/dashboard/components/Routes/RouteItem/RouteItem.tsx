import React, { FC } from 'react'
import { Pressable, View } from 'react-native'

import GlassView from '@common/components/GlassView'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY, hexToRgba } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { createTab } from '@common/utils/links'

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
}

interface Props {
  routeItem: RouteItemType
  index: number
  routeItemsLength: number
}

const ITEM_HEIGHT = 52
const ICON_SIZE = 28

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
          <GlassView
            tintColor1={hovered ? '#fff' : 'rgba(255, 255, 255, 0.12)'}
            tintColor2={hovered ? '#fff' : 'rgba(255, 255, 255, 0.12)'}
            blurAmount={20}
            shineColor="rgba(255, 255, 255, 0.2)"
            testID={routeItem.testID}
            cssStyle={{
              marginBottom: 4,
              borderRadius: BORDER_RADIUS_PRIMARY,
              height: ITEM_HEIGHT,
              overflow: 'hidden',
              width: routeItem.route === WEB_ROUTES.swapAndBridge ? 88 : ITEM_HEIGHT
            }}
          >
            <View style={[flexbox.center, flexbox.alignCenter, flexbox.flex1]}>
              <routeItem.icon
                color={
                  hovered
                    ? '#000000'
                    : routeItem.route === WEB_ROUTES.rewards
                      ? undefined
                      : '#FFFFFF'
                }
                height={ICON_SIZE}
                width={ICON_SIZE}
              />
            </View>
          </GlassView>
          <Text
            color="#F2F4F7"
            weight="medium"
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
