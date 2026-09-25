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
import { getUiType } from '@common/utils/uiType'

import getStyles from './styles'

/** Matches the original mobile token-details footer icon hit area. */
const ICON_AREA_HEIGHT = 52

const { isSidePanel } = getUiType()

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
  /**
   * Uses a narrower fixed-width layout (smaller icon + 2-line text) without switching to the
   * flexible compact layout, e.g. to fit a 5th action in the same footer width as 4.
   */
  small?: boolean
  /** Drops the trailing gap on the last button of a footer row. */
  isLast?: boolean
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
  forceCompact,
  small,
  isLast
}) => {
  const { styles, theme } = useTheme(getStyles)
  // Compact = mobile or narrow side panel — both use the original mobile button styles.
  const { isCompactLayout } = useCompactActionRequestLayout()
  const shouldUseCompactLayout = isCompactLayout || forceCompact
  const shouldUseSmallLayout = !shouldUseCompactLayout && !!small
  const shouldUseNarrowText = shouldUseCompactLayout || shouldUseSmallLayout
  const getActionStyle = () => {
    if (shouldUseCompactLayout) return styles.actionCompact
    if (shouldUseSmallLayout) return styles.actionSmall

    return styles.action
  }
  // Side panel uses the tertiary (mobile-like) hover colors instead of the popup/tab secondary ones.
  const [bindAnim, animStyle, isHovered] = useCustomHover({
    property: 'backgroundColor',
    values: {
      from: isWeb && !isSidePanel ? theme.primaryBackground : theme.secondaryBackground,
      to: isWeb && !isSidePanel ? theme.secondaryBackground : theme.tertiaryBackground
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
          getActionStyle(),
          isDisabled && { opacity: 0.4 },
          !shouldUseCompactLayout &&
            isWeb &&
            !isLast && { marginRight: shouldUseSmallLayout ? 4 : 6 }
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
            width={shouldUseSmallLayout ? Math.round(iconWidth * 0.8) : iconWidth}
            strokeWidth={strokeWidth}
          />
        </Animated.View>
        <Text
          fontSize={shouldUseNarrowText ? 10 : 12}
          weight="medium"
          numberOfLines={shouldUseNarrowText ? 2 : 1}
          style={[text.center, shouldUseNarrowText && { minWidth: 0, width: '100%' }]}
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
