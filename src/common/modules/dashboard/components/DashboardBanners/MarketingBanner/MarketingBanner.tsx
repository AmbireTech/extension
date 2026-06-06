import React, { useCallback } from 'react'
import { Pressable, View } from 'react-native'

import { Banner, MarketingBannerTypes } from '@ambire-common/interfaces/banner'
import CloseIcon from '@common/assets/svg/CloseIcon'
import Text from '@common/components/Text'
import { isMobile } from '@common/config/env'
import useController from '@common/hooks/useController'
import { AnimatedPressable, useMultiHover } from '@common/hooks/useHover'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY, hexToRgba } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { openInTab } from '@common/utils/links'
import { getUiType } from '@common/utils/uiType'

const TYPE_EMOJI_MAP: { [key in MarketingBannerTypes]: string } = {
  updates: '💜',
  rewards: '💎',
  new: '📢',
  vote: '✋',
  tips: '💡',
  alert: '🚨'
}

const FALLBACK_EMOJI = '🔥'

interface Props {
  banner: Banner
}

const MarketingBanner: React.FC<Props> = ({ banner }) => {
  const { isPopup } = getUiType()
  const { dispatch: bannerDispatch } = useController('BannerController')
  const { dispatch: surveyDispatch } = useController('SurveyController')
  const { theme } = useTheme()
  const { text, title, type: bannerType = 'updates', actions, emoji: backendEmoji } = banner
  console.log(backendEmoji)
  const emoji = backendEmoji || TYPE_EMOJI_MAP[bannerType as MarketingBannerTypes] || FALLBACK_EMOJI
  const action = actions?.[0]
  const url = action?.actionName === 'open-link' ? action.meta.url : ''
  const size = (banner.text?.length || 0) > 50 ? 'large' : 'normal'
  const emojiSize = isMobile ? 44 : size === 'large' ? 64 : 48
  const { navigate } = useNavigation()

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

  const dismissBanner = useCallback(() => {
    bannerDispatch({
      type: 'method',
      params: {
        method: 'dismissBanner',
        args: [banner.id]
      }
    })
  }, [banner.id, bannerDispatch])

  return (
    <AnimatedPressable
      style={[
        spacings.phTy,
        spacings.pvTy,
        flexbox.directionRow,
        { borderRadius: BORDER_RADIUS_PRIMARY, borderWidth: 1 },
        spacings.mbTy,
        animStyle,
        { alignItems: 'center' }
      ]}
      onPress={async () => {
        const action = banner.actions[0]
        if (action?.actionName === 'survey') {
          surveyDispatch({
            type: 'method',
            params: { method: 'fetchSurvey', args: [action.meta.surveyId, banner.id] }
          })
          navigate(WEB_ROUTES.survey)
        } else await openInTab({ url, shouldCloseCurrentWindow: isPopup })
      }}
      {...bindAnim}
    >
      <View
        style={[
          flexbox.center,
          {
            width: emojiSize,
            height: emojiSize
          },
          spacings.plTy
        ]}
      >
        <Text
          style={{
            fontSize: emojiSize * 0.7
          }}
        >
          {emoji}
        </Text>
      </View>
      <View style={[spacings.ml, flexbox.flex1]}>
        <View style={[flexbox.directionRow, flexbox.justifySpaceBetween]}>
          <Text weight="medium" style={{ flexShrink: 1 }}>
            {title}
          </Text>
          <Pressable
            onPress={dismissBanner}
            hitSlop={8}
            style={{ width: 24, height: 24, ...flexbox.center }}
            testID="banner-button-reject"
          >
            <CloseIcon color={theme.iconPrimary} strokeWidth="2" width={12} height={12} />
          </Pressable>
        </View>
        <Text appearance="secondaryText" fontSize={14} style={spacings.mrLg}>
          {text}
        </Text>
      </View>
    </AnimatedPressable>
  )
}

export default MarketingBanner
