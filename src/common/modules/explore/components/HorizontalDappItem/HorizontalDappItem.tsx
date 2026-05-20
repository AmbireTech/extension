import React, { useCallback } from 'react'
import { View } from 'react-native'

import { Dapp } from '@ambire-common/interfaces/dapp'
import Text from '@common/components/Text'
import { isMobile } from '@common/config/env'
import useController from '@common/hooks/useController'
import { AnimatedPressable, useCustomHover } from '@common/hooks/useHover'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import { openInTab } from '@common/utils/links/links'
import ManifestImage from '@web/components/ManifestImage'

export const HORIZONTAL_ITEM_ICON_SIZE = 56
export const HORIZONTAL_ITEM_WIDTH = 72
export const HORIZONTAL_ITEM_GUTTER = 12

type Props = {
  dapp: Dapp
}

const HorizontalDappItem = ({ dapp }: Props) => {
  const { theme } = useTheme()
  const navigation = useNavigation()
  const { dispatch: dappsDispatch } = useController('DappsController')

  const [bindAnim, animStyle] = useCustomHover({
    property: 'opacity',
    values: { from: 1, to: 0.75 }
  })

  const handlePress = useCallback(() => {
    dappsDispatch({
      type: 'method',
      params: { method: 'addToRecentDapps', args: [dapp.id] }
    })

    if (isMobile) {
      navigation.navigate(ROUTES.dappWebView, {
        state: { url: dapp.url, name: dapp.name }
      })
    } else {
      void openInTab({ url: dapp.url })
    }
  }, [dapp.id, dapp.url, dapp.name, dappsDispatch, navigation])

  const fallback = useCallback(() => {
    const initials = (dapp.name || '').trim().charAt(0).toUpperCase()
    return (
      <View
        style={[
          flexbox.center,
          {
            width: HORIZONTAL_ITEM_ICON_SIZE,
            height: HORIZONTAL_ITEM_ICON_SIZE,
            borderRadius: HORIZONTAL_ITEM_ICON_SIZE / 2,
            backgroundColor: theme.secondaryBackground
          }
        ]}
      >
        <Text appearance="primaryText" weight="semiBold" fontSize={20}>
          {initials}
        </Text>
      </View>
    )
  }, [dapp.name, theme.secondaryBackground])

  return (
    <AnimatedPressable
      {...bindAnim}
      onPress={handlePress}
      style={[
        animStyle,
        flexbox.alignCenter,
        { width: HORIZONTAL_ITEM_WIDTH, marginRight: HORIZONTAL_ITEM_GUTTER }
      ]}
    >
      <ManifestImage
        uri={dapp.icon || ''}
        size={HORIZONTAL_ITEM_ICON_SIZE}
        fallback={fallback}
        containerStyle={{
          borderRadius: HORIZONTAL_ITEM_ICON_SIZE / 2,
          overflow: 'hidden',
          backgroundColor: theme.secondaryBackground
        }}
        iconScale={1}
      />
      <Text
        numberOfLines={1}
        fontSize={12}
        weight="medium"
        appearance="primaryText"
        style={[text.center, spacings.mtTy, { maxWidth: HORIZONTAL_ITEM_WIDTH }]}
      >
        {dapp.name}
      </Text>
    </AnimatedPressable>
  )
}

export default React.memo(HorizontalDappItem)
