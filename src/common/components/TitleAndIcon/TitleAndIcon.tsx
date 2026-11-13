import { FC, ReactNode } from 'react'
import { View, ViewStyle } from 'react-native'
import { SvgProps } from 'react-native-svg'

import { useIsSheetSectionHeaderGlass } from '@common/components/BottomSheet/SheetStickyHeader/SheetSectionHeaderGlassContext'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

const GLASS_STYLE = { backgroundColor: 'transparent' }

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
  // As a sheet's section header, the glass behind it shows through
  const isSheetSectionHeaderGlass = useIsSheetSectionHeaderGlass()

  return (
    <View
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        flexbox.justifySpaceBetween,
        spacings.ptTy,
        spacings.phSm,
        spacings.pbTy,
        { backgroundColor: theme.primaryBackground },
        style,
        isSheetSectionHeaderGlass && GLASS_STYLE
      ]}
    >
      <View style={[flexbox.directionRow, flexbox.alignCenter]}>
        <Icon width={20} height={20} color={theme.secondaryText} />
        <Text fontSize={14} appearance="secondaryText" weight="medium" style={spacings.mlMi}>
          {title}
        </Text>
      </View>
      {children}
    </View>
  )
}

export default TitleAndIcon
