import React, { FC } from 'react'
import { Pressable } from 'react-native'
import { SvgProps } from 'react-native-svg'

import Text from '@common/components/Text'
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

  return (
    <Pressable style={[flexbox.directionRow, flexbox.alignCenter]} onPress={onPress}>
      <Text
        testID={testID}
        fontSize={textSize}
        appearance="secondaryText"
        weight="medium"
        style={spacings.mrMi}
        underline
      >
        {label}
      </Text>
      <Icon width={iconSize} height={iconSize} color={theme.iconPrimary} strokeWidth={2} />
    </Pressable>
  )
}

export default FooterActionLink
