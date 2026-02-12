import { FC, ReactNode } from 'react'
import { View, ViewStyle } from 'react-native'
import { SvgProps } from 'react-native-svg'

import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

const TitleAndIcon = ({
  title,
  icon: Icon,
  children,
  style
}: {
  title: string
  icon: FC<SvgProps>
  children?: ReactNode
  style?: ViewStyle
}) => {
  const { theme } = useTheme()

  return (
    <View
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        flexbox.justifySpaceBetween,
        spacings.pt,
        spacings.phSm,
        spacings.pbTy,
        { backgroundColor: theme.primaryBackground },
        style
      ]}
    >
      <View style={[flexbox.directionRow, flexbox.alignCenter]}>
        <Icon width={16} height={16} color={theme.iconPrimary} />
        <Text fontSize={14} appearance="tertiaryText" weight="medium" style={spacings.mlTy}>
          {title}
        </Text>
      </View>
      {children}
    </View>
  )
}

export default TitleAndIcon
