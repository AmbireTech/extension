import React, { FC } from 'react'
import { Animated, Pressable } from 'react-native'

import Text from '@common/components/Text'
import Tooltip from '@common/components/Tooltip'
import { isWeb } from '@common/config/env'
import { useCustomHover } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import useCompactActionRequestLayout from '@common/modules/action-requests/hooks/useCompactActionRequestLayout'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

import getStyles from './styles'

/** Matches the original mobile token-details footer icon hit area. */
const ICON_AREA_HEIGHT = 52

import type { TokenResult } from '@ambire-common/libs/portfolio'
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
  /** Uses the narrow action layout even when the surrounding screen is not compact. */
  forceCompact?: boolean
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
  testID,
  forceCompact
}) => {
  const { styles, theme } = useTheme(getStyles)
  // Compact = mobile or narrow side panel — both use the original mobile button styles.
  const { isCompactLayout } = useCompactActionRequestLayout()
  const shouldUseCompactLayout = isCompactLayout || forceCompact
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
          shouldUseCompactLayout ? styles.actionCompact : styles.action,
          isDisabled && { opacity: 0.4 },
          !shouldUseCompactLayout && isWeb && id !== 'hide-unhide' && { marginRight: 6 }
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
        <Animated.View
          style={[
            spacings.mbTy,
            animStyle,
            {
              borderRadius: BORDER_RADIUS_PRIMARY,
              width: '100%',
              height: ICON_AREA_HEIGHT,
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
        <Text
          fontSize={shouldUseCompactLayout ? 10 : 12}
          weight="medium"
          numberOfLines={shouldUseCompactLayout ? 2 : 1}
          style={[text.center, shouldUseCompactLayout && { minWidth: 0, width: '100%' }]}
        >
          {btnText}
        </Text>
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
