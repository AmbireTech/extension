import { View } from 'react-native'
import { SvgProps } from 'react-native-svg'

import DownArrowIcon from '@common/assets/svg/DownArrowIcon'
import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import UpArrowIcon from '@common/assets/svg/UpArrowIcon'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'
import { AnimatedPressable, useCustomHover } from '@web/hooks/useHover'

import getStyles from './styles'

interface Props {
  text: string
  icon: React.FC<any>
  onPress: () => void
  withBottomSpacing?: boolean
  iconProps?: SvgProps
  children?: React.ReactNode
  testID?: string
  disabled?: boolean
  status?: 'default' | 'expanded' | 'collapsed'
  icons?: { key: string; component: React.FC<any> }[]
}

const Option = ({
  icon: Icon,
  onPress,
  withBottomSpacing,
  text,
  iconProps = {},
  children,
  testID,
  disabled,
  status = 'default',
  icons = []
}: Props) => {
  const { theme, styles, themeType } = useTheme(getStyles)
  const [bindAnim, animStyle, isHovered] = useCustomHover({
    property: 'borderColor',
    values: {
      from: theme.primaryBackground,
      to: themeType === THEME_TYPES.DARK ? (theme.linkText as string) : theme.primary
    }
  })

  return (
    <AnimatedPressable
      key={text}
      style={[
        styles.container,
        withBottomSpacing && spacings.mb,
        animStyle,
        disabled && { opacity: 0.5 }
      ]}
      onPress={onPress}
      {...bindAnim}
      testID={testID}
      disabled={disabled}
    >
      <View style={[flexbox.directionRow, flexbox.alignCenter]}>
        <View style={styles.iconWrapper}>
          <Icon
            color={
              isHovered && themeType === THEME_TYPES.LIGHT ? theme.iconPrimary2 : theme.iconPrimary
            }
            {...iconProps}
          />
        </View>
        <Text style={flexbox.flex1} fontSize={14} weight="medium" numberOfLines={1}>
          {text}
        </Text>
        {icons.length > 0 && (
          <View style={[flexbox.directionRow, spacings.mrTy]}>
            {icons.map(({ key, component: Component }) => (
              <Component key={key} width={32} height={32} style={spacings.mrMi} />
            ))}
          </View>
        )}

        <View style={spacings.mrSm}>
          {status === 'default' && <RightArrowIcon />}
          {status === 'expanded' && <UpArrowIcon />}
          {status === 'collapsed' && <DownArrowIcon />}
        </View>
      </View>
      {children}
    </AnimatedPressable>
  )
}

export default Option
