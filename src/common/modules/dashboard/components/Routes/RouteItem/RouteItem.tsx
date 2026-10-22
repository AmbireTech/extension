import React, { FC, useContext } from 'react'
import { Pressable, View } from 'react-native'

import GlassView from '@common/components/GlassView'
import Text from '@common/components/Text'
import { isMobile, isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import OverviewBackdropBlur, {
  OverviewBackdropContext
} from '@common/modules/dashboard/components/DashboardOverview/OverviewBackdropBlur'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import alert from '@common/services/alert'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { openInTab } from '@common/utils/links'

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
  badge?: number
  /** Shows a "New" pill on the top-right corner of the button. */
  isNew?: boolean
}

interface Props {
  routeItem: RouteItemType
  index: number
  routeItemsLength: number
  isNarrowWebLayout: boolean
}

const ITEM_HEIGHT = 40
const ICON_SIZE = 24
// GlassView's default
const BLUR_AMOUNT = 4

const RouteItem: FC<Props> = ({ routeItem, index, routeItemsLength, isNarrowWebLayout }) => {
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const { addToast } = useToast()
  const { theme } = useTheme()
  const overviewBackdrop = useContext(OverviewBackdropContext)
  // On the overview card, web blurs a copy of the card's background instead of what is behind
  // the button: the pages slide over it, and a backdrop filter under them makes them flicker
  const isOnOverviewBackdrop = isWeb && !!overviewBackdrop
  const itemWidth = routeItem.route === WEB_ROUTES.swapAndBridge ? 88 : 48

  return (
    <Pressable
      key={routeItem.label}
      style={[
        flexbox.alignCenter,
        isNarrowWebLayout && { flexShrink: 0 },
        index !== routeItemsLength - 1 && spacings.mrSm
      ]}
      disabled={routeItem.disabled}
      onPress={async () => {
        if (routeItem?.onPress) {
          routeItem.onPress()
          return
        }

        if (routeItem.isExternal && routeItem.route) {
          try {
            await openInTab({ url: routeItem.route })
          } catch {
            addToast(t('Failed to open new tab.'), { type: 'error' })
          }
          return
        }
        if (!routeItem.route) {
          if (isMobile) {
            alert('Coming soon!')
          }
          return
        }

        navigate(routeItem.route)
      }}
    >
      {({ hovered }: any) => (
        <>
          <View>
            {isOnOverviewBackdrop && (
              <OverviewBackdropBlur
                width={itemWidth}
                height={ITEM_HEIGHT}
                blurRadius={BLUR_AMOUNT}
              />
            )}
            <GlassView
              tintColor1={hovered ? '#fff' : undefined}
              tintColor2={hovered ? '#fff' : undefined}
              shineColor="#aaaaaa"
              testID={routeItem.testID}
              blurAmount={isOnOverviewBackdrop ? 0 : BLUR_AMOUNT}
              cssStyle={{
                marginBottom: 4,
                height: ITEM_HEIGHT,
                overflow: 'hidden',
                width: itemWidth
              }}
            >
              <View style={[flexbox.center, flexbox.alignCenter, flexbox.flex1]}>
                <routeItem.icon
                  color={hovered ? '#000000' : '#FFFFFF'}
                  height={ICON_SIZE}
                  width={ICON_SIZE}
                />
                {!!routeItem.badge && (
                  <View
                    style={[
                      flexbox.center,
                      {
                        position: 'absolute',
                        top: 3,
                        right: 3,
                        minWidth: 14,
                        height: 14,
                        borderRadius: 7,
                        backgroundColor: theme.primaryAccent
                      }
                    ]}
                  >
                    <Text fontSize={9} weight="semiBold" color={theme.neutral100}>
                      {routeItem.badge}
                    </Text>
                  </View>
                )}
              </View>
            </GlassView>
            {!!routeItem.isNew && (
              <View
                style={[
                  flexbox.center,
                  {
                    position: 'absolute',
                    top: -6,
                    right: -8,
                    height: 16,
                    paddingHorizontal: 6,
                    borderRadius: 8,
                    backgroundColor: theme.primaryAccent
                  }
                ]}
              >
                <Text fontSize={10} weight="semiBold" color={theme.neutral100}>
                  {t('New')}
                </Text>
              </View>
            )}
          </View>
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
