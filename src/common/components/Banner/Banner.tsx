import React, { FC, useMemo } from 'react'
import { Pressable, View, ViewStyle } from 'react-native'

import { BannerType } from '@ambire-common/interfaces/banner'
import CloseIcon from '@common/assets/svg/CloseIcon'
import ErrorIcon from '@common/assets/svg/ErrorIcon'
import InfoIcon from '@common/assets/svg/InfoIcon'
import SuccessIcon from '@common/assets/svg/SuccessIcon'
import WarningIcon from '@common/assets/svg/WarningIcon'
import CommonButton, { Props as CommonButtonProps } from '@common/components/Button'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_MI, SPACING_TY } from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@web/utils/uiType'

import getStyles from './styles'

const ICON_MAP: {
  [key in BannerType]: React.FC<any>
} = {
  error: ErrorIcon,
  warning: WarningIcon,
  success: SuccessIcon,
  info: InfoIcon,
  info2: InfoIcon
}

export interface Props {
  title: string
  type: BannerType
  text?: string
  children?: React.ReactElement | React.ReactElement[]
  renderButtons?: React.ReactNode | React.ReactNode[]
  CustomIcon?: React.FC<any> | null
  style?: ViewStyle
  contentContainerStyle?: ViewStyle
  titleFontSize?: number
  onClosePress?: () => void
}

const BannerButton: FC<CommonButtonProps & { isReject?: boolean; testId?: string }> = ({
  isReject,
  style,
  testId,
  type,
  ...rest
}) => {
  const { theme } = useTheme()

  const buttonType = useMemo(() => {
    if (isReject) return 'ghost'

    return type
  }, [isReject, type])

  return (
    <CommonButton
      testID={testId}
      size="small"
      textUnderline={isReject}
      textStyle={isReject && { color: theme.errorDecorative }}
      style={[
        spacings.mlTy,
        spacings.ph,
        isReject && { borderWidth: 0 },
        { minWidth: 80 },
        (style || {}) as ViewStyle
      ]}
      hasBottomSpacing={false}
      type={buttonType}
      submitOnEnter={false}
      innerContainerStyle={(hovered: boolean) =>
        isReject && hovered
          ? { backgroundColor: theme.errorBackground }
          : { backgroundColor: 'transparent' }
      }
      {...rest}
    />
  )
}

const { isTab } = getUiType()

const Banner = React.memo(
  ({
    type,
    title,
    text,
    children,
    CustomIcon,
    renderButtons,
    titleFontSize,
    style,
    contentContainerStyle,
    onClosePress
  }: Props) => {
    const { styles, theme, themeType } = useTheme(getStyles)

    const Icon = useMemo(() => {
      if (CustomIcon) return CustomIcon

      return ICON_MAP[type]
    }, [CustomIcon, type])

    return (
      <View
        style={[
          styles.container,
          ...(!onClosePress ? [flexbox.alignCenter, spacings.prSm] : []),
          {
            backgroundColor:
              themeType === THEME_TYPES.DARK
                ? `${theme[`${type}Decorative`] as string}1F`
                : theme[`${type}Background`]
          },
          style
        ]}
        testID={`dashboard-${type}-banner`}
      >
        <View
          style={[
            styles.content,
            { borderLeftColor: theme[`${type}Decorative`] },
            contentContainerStyle
          ]}
        >
          <View
            style={[
              spacings.mrSm,
              themeType === THEME_TYPES.DARK && {
                width: 30,
                height: 30,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: BORDER_RADIUS_PRIMARY,
                backgroundColor: `${theme[`${type}Decorative`] as string}1F`,
                marginLeft: -SPACING_MI,
                marginRight: SPACING_TY
              }
            ]}
          >
            <Icon width={20} height={20} color={theme[`${type}Decorative`]} />
          </View>

          <View style={[flexbox.wrap, flexbox.flex1]}>
            <Text
              appearance={themeType === THEME_TYPES.DARK ? `${type}Text` : 'primaryText'}
              fontSize={titleFontSize || (isTab ? 16 : 14)}
              weight="medium"
            >
              {title}
            </Text>
            <Text fontSize={isTab ? 14 : 12} weight="regular" appearance="secondaryText">
              {text}
            </Text>
          </View>
        </View>
        {onClosePress ? (
          <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.justifySpaceBetween]}>
            <View style={[flexbox.directionRow, flexbox.alignCenter]}>{renderButtons}</View>
            <Pressable
              onPress={onClosePress}
              hitSlop={8}
              style={[
                spacings.mhSm,
                spacings.mvSm,
                spacings.pvTy,
                spacings.phTy,
                {
                  borderRadius: 50,
                  backgroundColor: `${theme[`${type}Decorative`] as string}1F`
                }
              ]}
            >
              <CloseIcon
                color={theme[`${type}Decorative`]}
                strokeWidth="2"
                width={10}
                height={10}
              />
            </Pressable>
          </View>
        ) : (
          <View style={[flexbox.directionRow, flexbox.alignCenter]}>{renderButtons}</View>
        )}
        {children}
      </View>
    )
  }
)

export { BannerButton }

export default Banner
