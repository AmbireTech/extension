import { useCallback } from 'react'
import { Animated, View } from 'react-native'

import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import Text from '@common/components/Text'
import { AnimatedPressable, useMultiHover } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import getStyles from '@common/modules/networks/components/NetworkBottomSheet/styles'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

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
  const { styles, theme } = useTheme(getStyles)
  const [bindAnim, animStyle] = useMultiHover({
    values: [
      {
        property: 'backgroundColor',
        from: theme.primaryBackground,
        to: theme.secondaryBackground
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
          backgroundColor: animStyle.backgroundColor
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
