import React, { FC } from 'react'
import { Animated, Pressable, View } from 'react-native'

import { TokenResult } from '@ambire-common/libs/portfolio'
import Text from '@common/components/Text'
import Tooltip from '@common/components/Tooltip'
import { isMobile, isWeb } from '@common/config/env'
import { useCustomHover } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import { getUiType } from '@common/utils/uiType'

import getStyles from './styles'

const COMPACT_ICON_AREA_HEIGHT = 44
const DESKTOP_ICON_AREA_HEIGHT = 52
const COMPACT_LABEL_AREA_HEIGHT = 28
const DESKTOP_LABEL_AREA_HEIGHT = 32

interface Props {
  id: string
  text: string
  onPress: (token: TokenResult) => void
  icon: any
  token: TokenResult
  strokeWidth?: number
  isDisabled?: boolean
  tooltipText?: string
  testID?: string
  iconWidth?: number
}

const TokenDetailsButton: FC<Props> = ({
  id,
  strokeWidth,
  iconWidth = 28,
  text: btnText,
  isDisabled,
  tooltipText,
  onPress,
  icon: Icon,
  token,
  testID
}) => {
  const { styles, theme } = useTheme(getStyles)
  const { isSidePanel } = getUiType()
  const isCompactLayout = isMobile || isSidePanel
  const iconAreaHeight = isCompactLayout ? COMPACT_ICON_AREA_HEIGHT : DESKTOP_ICON_AREA_HEIGHT
  const labelAreaHeight = isCompactLayout ? COMPACT_LABEL_AREA_HEIGHT : DESKTOP_LABEL_AREA_HEIGHT
  const resolvedIconWidth = isCompactLayout ? Math.min(iconWidth, 24) : iconWidth
  const [bindAnim, animStyle, isHovered] = useCustomHover({
    property: 'backgroundColor',
    values: {
      from: isWeb ? theme.primaryBackground : theme.secondaryBackground,
      to: isWeb ? theme.secondaryBackground : theme.tertiaryBackground
    }
  })
  const tooltipId = `tooltip-${id}`

  return (
    <>
      <Pressable
        testID={testID}
        key={id}
        dataSet={tooltipText ? { tooltipId } : undefined}
        style={[
          isCompactLayout ? styles.actionCompact : styles.action,
          isDisabled && { opacity: 0.4 },
          isWeb && !isCompactLayout && id !== 'hide-unhide' && { marginRight: 6 }
        ]}
        // Purposely don't disable the button (but block the onPress action) in
        // case of a tooltip, because it should be clickable to show the tooltip.
        disabled={isDisabled && !tooltipText}
        onPress={() => {
          if (isDisabled) return

          onPress(token)
        }}
        {...bindAnim}
      >
        {isCompactLayout ? (
          <>
            <Animated.View
              style={[
                animStyle,
                {
                  borderRadius: BORDER_RADIUS_PRIMARY,
                  width: '100%',
                  height: iconAreaHeight,
                  ...flexbox.center
                }
              ]}
            >
              <Icon
                color={isHovered ? theme.primaryAccent : theme.primaryText}
                width={resolvedIconWidth}
                height={24}
                strokeWidth={strokeWidth}
              />
            </Animated.View>
            <View
              style={{
                width: '100%',
                height: labelAreaHeight,
                justifyContent: 'flex-start',
                alignItems: 'center'
              }}
            >
              <Text
                fontSize={isMobile ? 10 : 12}
                weight="medium"
                numberOfLines={2}
                style={[text.center, { minWidth: 0, width: '100%' }]}
              >
                {btnText}
              </Text>
            </View>
          </>
        ) : (
          <>
            <Animated.View
              style={[
                spacings.mbTy,
                animStyle,
                {
                  borderRadius: BORDER_RADIUS_PRIMARY,
                  width: '100%',
                  height: DESKTOP_ICON_AREA_HEIGHT,
                  ...flexbox.center
                }
              ]}
            >
              <Icon
                color={isHovered ? theme.primaryAccent : theme.primaryText}
                width={iconWidth}
                strokeWidth={strokeWidth}
              />
            </Animated.View>
            <Text fontSize={12} weight="medium" style={text.center}>
              {btnText}
            </Text>
          </>
        )}
      </Pressable>
      {tooltipText && (
        <Tooltip id={tooltipId}>
          <Text fontSize={14} appearance="secondaryText">
            {tooltipText}
          </Text>
        </Tooltip>
      )}
    </>
  )
}

export default TokenDetailsButton
