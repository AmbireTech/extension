import { View } from 'react-native'
import { SvgProps } from 'react-native-svg'

import DownArrowIcon from '@common/assets/svg/DownArrowIcon'
import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import UpArrowIcon from '@common/assets/svg/UpArrowIcon'
import Text from '@common/components/Text'
import { AnimatedPressable, useCustomHover } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import { BUTTON_HEIGHT } from '@common/components/Button'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'

// Applied to each part but the badge, which stays readable on a disabled option
const disabledStyle = { opacity: 0.5 }

interface Props {
  text: string
  icon: React.FC<any>
  onPress: () => void
  withBottomSpacing?: boolean
  iconProps?: SvgProps
  children?: React.ReactNode
  testID?: string
  disabled?: boolean
  status?: 'default' | 'expanded' | 'collapsed' | 'none'
  icons?: { key: string; component: React.FC<any> }[]
  ref?: React.Ref<any>
  /** A badge next to the text, e.g. "Soon" for an option that is not available yet. Never dimmed */
  badge?: React.ReactNode
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
  icons = [],
  ref,
  badge
}: Props) => {
  const { theme, styles, themeType } = useTheme(getStyles)
  const [bindAnim, animStyle, isHovered] = useCustomHover({
    property: 'backgroundColor',
    values: {
      from: theme.primaryBackground,
      to: theme.secondaryBackground
    }
  })

  return (
    <AnimatedPressable
      key={text}
      style={[
        styles.container,
        withBottomSpacing && spacings.mb,
        // Keeps the space below the expanded options
        !!children && spacings.pbTy,
        animStyle,
        status === 'expanded' && {
          backgroundColor: theme.secondaryBackground
        }
      ]}
      onPress={onPress}
      {...bindAnim}
      testID={testID}
      disabled={disabled}
      accessibilityRole="button"
      ref={ref}
    >
      <View style={[flexbox.directionRow, flexbox.alignCenter, { height: BUTTON_HEIGHT }]}>
        <View style={[styles.iconWrapper, disabled && disabledStyle]}>
          <Icon
            color={
              isHovered && themeType === THEME_TYPES.LIGHT ? theme.primaryAccent : theme.iconPrimary
            }
            {...iconProps}
          />
        </View>
        {/* The badge follows the text right away, so the text only takes as much room as it needs */}
        <View style={[flexbox.flex1, flexbox.directionRow, flexbox.alignCenter]}>
          <Text
            style={[{ flexShrink: 1 }, !!badge && spacings.mrTy, disabled && disabledStyle]}
            fontSize={14}
            weight="medium"
            numberOfLines={1}
          >
            {text}
          </Text>
          {badge}
        </View>
        {icons.length > 0 && (
          <View style={[flexbox.directionRow, spacings.mrTy, disabled && disabledStyle]}>
            {icons.map(({ key, component: Component }) => (
              <Component key={key} width={32} height={32} style={spacings.mrMi} />
            ))}
          </View>
        )}

        <View style={[spacings.mrSm, disabled && disabledStyle]}>
          {status === 'default' && <RightArrowIcon />}
          {status === 'expanded' && <UpArrowIcon />}
          {status === 'collapsed' && <DownArrowIcon />}
        </View>
      </View>
      {disabled ? <View style={disabledStyle}>{children}</View> : children}
    </AnimatedPressable>
  )
}

export default Option
