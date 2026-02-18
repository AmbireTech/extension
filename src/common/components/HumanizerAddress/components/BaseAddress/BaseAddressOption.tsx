import React, { FC } from 'react'
import { View } from 'react-native'

import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { AnimatedPressable, useCustomHover } from '@web/hooks/useHover'

interface Props {
  renderIcon: () => React.ReactNode
  onPress: () => void
  title: string
  text?: string
  isAddress?: boolean
  renderRightIcon?: () => React.ReactNode
}

const BaseAddressOption: FC<Props> = ({
  renderIcon,
  title,
  text,
  isAddress,
  onPress,
  renderRightIcon
}) => {
  const { theme } = useTheme()
  const [bindAnim, animStyle] = useCustomHover({
    property: 'backgroundColor',
    values: {
      from: theme.primaryBackground,
      to: theme.secondaryBackground
    }
  })

  return (
    <AnimatedPressable
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        flexbox.justifySpaceBetween,
        spacings.phSm,
        {
          height: text ? 48 : 42
        },
        animStyle
      ]}
      onPress={onPress}
      {...bindAnim}
    >
      <View style={[flexbox.directionRow, flexbox.alignCenter]}>
        <View
          style={{
            width: 20,
            height: 20,
            ...flexbox.center
          }}
        >
          {renderIcon()}
        </View>
        <View style={spacings.mlTy}>
          <Text weight="medium" fontSize={12}>
            {title}
          </Text>
          {!!text && (
            <Text
              appearance="secondaryText"
              fontSize={10}
              weight={isAddress ? 'mono_regular' : undefined}
            >
              {text}
            </Text>
          )}
        </View>
      </View>
      {renderRightIcon && renderRightIcon()}
    </AnimatedPressable>
  )
}

export default BaseAddressOption
