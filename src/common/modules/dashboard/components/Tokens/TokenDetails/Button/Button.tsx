import React, { FC } from 'react'
import { Animated, Pressable, View } from 'react-native'

import { TokenResult } from '@ambire-common/libs/portfolio'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import Tooltip from '@common/components/Tooltip'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import { useCustomHover } from '@web/hooks/useHover'

import getStyles from './styles'

interface Props {
  id: string
  text: string
  onPress: (token: TokenResult) => void
  icon: any
  token: TokenResult
  handleClose: () => void
  isTokenInfoLoading: boolean
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
  handleClose,
  isTokenInfoLoading,
  testID
}) => {
  const { styles, theme } = useTheme(getStyles)
  const [bindAnim, animStyle, isHovered] = useCustomHover({
    property: 'backgroundColor',
    values: {
      from: theme.primaryBackground,
      to: theme.secondaryBackground
    }
  })
  const isTokenInfo = id === 'info'
  const tooltipId = `tooltip-${id}`

  return (
    <>
      <Pressable
        testID={testID}
        key={id}
        dataSet={tooltipText ? { tooltipId } : undefined}
        style={[styles.action, isDisabled && { opacity: 0.4 }]}
        // Purposely don't disable the button (but block the onPress action) in
        // case of a tooltip, because it should be clickable to show the tooltip.
        disabled={isDisabled && !tooltipText}
        onPress={() => {
          if (isDisabled) return

          onPress(token)
          handleClose()
        }}
        {...bindAnim}
      >
        <Animated.View
          style={[
            spacings.mbTy,
            animStyle,
            { borderRadius: BORDER_RADIUS_PRIMARY, width: '100%', height: 52, ...flexbox.center }
          ]}
        >
          {isTokenInfo && isTokenInfoLoading ? (
            <Spinner style={{ width: 32, height: 32 }} />
          ) : (
            <Icon
              color={isHovered ? theme.primaryAccent : theme.primaryText}
              width={iconWidth}
              strokeWidth={strokeWidth}
            />
          )}
        </Animated.View>
        <Text fontSize={12} weight="medium" style={text.center} numberOfLines={1}>
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
