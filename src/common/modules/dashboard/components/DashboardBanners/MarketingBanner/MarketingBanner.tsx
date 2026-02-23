import React from 'react'
import { Image, Pressable, View } from 'react-native'

import { Banner, MarketingBannerTypes } from '@ambire-common/interfaces/banner'
import CloseIcon from '@common/assets/svg/CloseIcon'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import { AnimatedPressable, useMultiHover } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY, hexToRgba } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { openInTab } from '@common/utils/links'
import { getUiType } from '@common/utils/uiType'

import temporaryImage from './assets/temporary-image.png'

const RELAYER_BANNER_TYPES = ['updates', 'rewards', 'new', 'vote', 'tips', 'alert'] as const

interface Props {
  banner: Banner
}

// @TODO: Replace temporary images
const typeImageMap: {
  [key in (typeof RELAYER_BANNER_TYPES)[number]]: string
} = {
  updates: temporaryImage,
  rewards: temporaryImage,
  new: temporaryImage,
  vote: temporaryImage,
  tips: temporaryImage,
  alert: temporaryImage
}

const MarketingBanner: React.FC<Props> = ({ banner }) => {
  const { isPopup } = getUiType()
  const { dispatch: bannerDispatch } = useController('BannerController')
  const { theme } = useTheme()
  const { text, title, type: bannerType = 'updates', actions } = banner
  const type = (
    RELAYER_BANNER_TYPES.includes(bannerType as any) ? bannerType : 'updates'
  ) as Exclude<MarketingBannerTypes, 'alert'>
  const action = actions?.[0]
  const url = action?.actionName === 'open-link' ? action.meta.url : ''
  const [bindAnim, animStyle] = useMultiHover({
    values: [
      {
        property: 'backgroundColor',
        from: theme.secondaryBackground,
        to: theme.tertiaryBackground
      },
      {
        property: 'borderColor',
        from: hexToRgba(theme.neutral100, 0),
        to: theme.neutral100
      }
    ]
  })

  return (
    <AnimatedPressable
      style={[
        spacings.phTy,
        spacings.pvTy,
        flexbox.directionRow,
        { borderRadius: BORDER_RADIUS_PRIMARY, borderWidth: 1 },
        spacings.mbTy,
        animStyle
      ]}
      onPress={async () => {
        await openInTab({ url, shouldCloseCurrentWindow: isPopup })
      }}
      {...bindAnim}
    >
      <Image
        source={{ uri: typeImageMap[type] }}
        width={64}
        height={64}
        style={{ width: 64, height: 64 }}
      />
      <View style={[spacings.ml, flexbox.flex1]}>
        <View style={[flexbox.directionRow, flexbox.justifySpaceBetween]}>
          <Text weight="medium">{title}</Text>
          <Pressable
            onPress={() => {
              bannerDispatch({
                type: 'method',
                params: {
                  method: 'dismissBanner',
                  args: [banner.id]
                }
              })
            }}
            hitSlop={8}
            style={{
              width: 24,
              height: 24,
              ...flexbox.center
            }}
            testID="banner-button-reject"
          >
            <CloseIcon color={theme.iconPrimary} strokeWidth="2" width={12} height={12} />
          </Pressable>
        </View>
        <Text appearance="secondaryText" fontSize={14} style={spacings.prLg}>
          {text}
        </Text>
      </View>
    </AnimatedPressable>
  )
}

export default MarketingBanner
