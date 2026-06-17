import React, { FC } from 'react'
import { SvgProps } from 'react-native-svg'

import Text from '@common/components/Text'
import { AnimatedPressable, useCustomHover } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  label: string
  onPress: () => void | Promise<void>
  textSize: number
  iconSize: number
  Icon: FC<SvgProps>
  testID?: string
}

const FooterActionLink: FC<Props> = ({ label, onPress, textSize, iconSize, Icon, testID }) => {
  const { theme } = useTheme()
  const [bindHover, hoverStyle, isHovered] = useCustomHover({
    property: 'opacity',
    values: {
      from: 1,
      to: 1
    }
  })

  return (
    <AnimatedPressable
      style={[flexbox.directionRow, flexbox.alignCenter, hoverStyle]}
      onPress={onPress}
      {...bindHover}
    >
      <Text
        testID={testID}
        fontSize={textSize}
        color={isHovered ? theme.primaryText : theme.secondaryText}
        weight="medium"
        style={spacings.mrMi}
        underline
      >
        {label}
      </Text>
      <Icon
        width={iconSize}
        height={iconSize}
        color={isHovered ? theme.primaryText : theme.iconPrimary}
        strokeWidth={2}
      />
    </AnimatedPressable>
  )
}

export default FooterActionLink
