import { useCallback } from 'react'
import { Animated, View } from 'react-native'

import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'
import { AnimatedPressable, useMultiHover } from '@web/hooks/useHover'
import getStyles from '@web/modules/networks/components/NetworkBottomSheet/styles'

const Option = ({
  renderIcon,
  title,
  text,
  onPress,
  disabled = false,
  tooltip
}: {
  renderIcon: React.ReactNode
  title: string
  text?: string
  disabled?: boolean
  tooltip?: string
  onPress: () => void
}) => {
  const { styles, theme, themeType } = useTheme(getStyles)
  const [bindAnim, animStyle] = useMultiHover({
    values: [
      {
        property: 'borderColor',
        from:
          themeType === THEME_TYPES.DARK
            ? `${String(theme.linkText)}00`
            : `${String(theme.primary)}00`,
        to: themeType === THEME_TYPES.DARK ? theme.primaryLight80 : theme.primary
      },
      {
        property: 'left',
        from: 0,
        to: 5
      }
    ]
  })

  const handleOnPress = useCallback(() => {
    if (disabled) return
    onPress()
  }, [disabled, onPress])

  const tooltipId = `tooltip-for-${text}`

  return (
    <AnimatedPressable
      onPress={handleOnPress}
      // @ts-ignore missing type, but the prop is valid
      dataSet={createGlobalTooltipDataSet({
        id: tooltipId,
        content: tooltip,
        hidden: !tooltip
      })}
      // Purposely don't disable the button (but block the onPress action) in
      // case of a tooltip, because it should be clickable to show the tooltip.
      disabled={disabled && !tooltip}
      style={[
        styles.item,
        flexbox.justifySpaceBetween,
        {
          borderWidth: 1,
          borderColor: animStyle.borderColor
        },
        disabled && { opacity: 0.4 }
      ]}
      {...(!disabled && bindAnim)}
    >
      <View style={[flexbox.directionRow, flexbox.alignCenter]}>
        <View
          style={{
            width: 40,
            height: 40,
            ...flexbox.center,
            ...spacings.mrTy
          }}
        >
          {renderIcon}
        </View>
        <Text fontSize={16} weight="medium">
          {title}
        </Text>
        {!!text && (
          <Text style={spacings.mlTy} fontSize={14} appearance="secondaryText">
            {text}
          </Text>
        )}
      </View>
      <Animated.View
        style={{
          left: animStyle.left
        }}
      >
        <RightArrowIcon />
      </Animated.View>
    </AnimatedPressable>
  )
}

export default Option
