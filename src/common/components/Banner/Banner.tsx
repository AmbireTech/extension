import React, { useMemo } from 'react'
import { Pressable, View, ViewStyle } from 'react-native'

import { BannerType } from '@ambire-common/interfaces/banner'
import CloseIcon from '@common/assets/svg/CloseIcon'
import ErrorIcon from '@common/assets/svg/ErrorIcon'
import InfoIcon from '@common/assets/svg/InfoIcon'
import SuccessIcon from '@common/assets/svg/SuccessIcon'
import WarningIcon from '@common/assets/svg/WarningIcon'
import Text from '@common/components/Text'
import { isMobile, isWeb } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import BannerButton from '@common/modules/dashboard/components/DashboardBanners/DashboardBanner/BannerButton'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'

const ICON_MAP: {
  [key in BannerType]: React.FC<any>
} = {
  error: ErrorIcon,
  warning: WarningIcon,
  success: SuccessIcon,
  info: InfoIcon
}

export interface Props {
  title: string
  type: BannerType
  text?: string
  children?: React.ReactNode | React.ReactNode[]
  CustomIcon?: React.FC<any> | null
  style?: ViewStyle
  contentContainerStyle?: ViewStyle
  titleFontSize?: number
  singleRow?: boolean
  buttonText?: string
  onPress?: () => void
  onCloseIconPress?: () => void
  dismissButtonText?: string
  onDismissButtonPress?: () => void
}

const Banner = React.memo(
  ({
    type,
    title,
    text,
    children,
    CustomIcon,
    titleFontSize,
    singleRow,
    buttonText,
    style,
    onCloseIconPress,
    onDismissButtonPress,
    dismissButtonText,
    onPress
  }: Props) => {
    const { styles, theme } = useTheme(getStyles)
    const hasPrimaryAction = !!buttonText && !!onPress
    const hasDismissAction = !!dismissButtonText && !!onDismissButtonPress
    const hasActions = hasPrimaryAction || hasDismissAction

    const Icon = useMemo(() => {
      if (CustomIcon) return CustomIcon

      return ICON_MAP[type]
    }, [CustomIcon, type])

    return (
      <View
        style={[
          styles.container,
          flexbox.alignStart,
          {
            backgroundColor: theme[`${type}Background`]
          },
          style
        ]}
      >
        <View
          style={[
            flexbox.directionRow,
            flexbox.justifySpaceBetween,
            singleRow ? flexbox.alignCenter : undefined,

            singleRow ? undefined : !!text ? spacings.mbTy : spacings.mbSm,
            {
              width: '100%'
            }
          ]}
        >
          <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.flex1]}>
            <Icon
              width={isMobile ? 22 : 24}
              height={isMobile ? 22 : 24}
              color={theme[`${type}Text`]}
            />
            <Text
              fontSize={titleFontSize || (isMobile ? 14 : 16)}
              weight="medium"
              style={[flexbox.flex1, spacings.mlMi, !singleRow && isMobile && { marginTop: 2 }]}
            >
              {title}
            </Text>
          </View>
          {singleRow && hasPrimaryAction && (
            <BannerButton
              type="primary"
              colorType={type}
              onPress={onPress}
              testID={`dashboard-${type}-banner`}
              style={spacings.mlTy}
            >
              {buttonText}
            </BannerButton>
          )}
          {!!onCloseIconPress && (
            <Pressable
              onPress={onCloseIconPress}
              hitSlop={8}
              style={{
                width: 24,
                height: 24,
                ...flexbox.center
              }}
              testID="banner-button-reject"
            >
              <CloseIcon color={theme.iconPrimary} strokeWidth="2" width={12} height={12} />
            </Pressable>
          )}
        </View>

        {!singleRow && (
          <View style={[isWeb && flexbox.wrap, { width: '100%' }]}>
            {!!text && (
              <Text
                fontSize={isMobile ? 12 : 14}
                weight="regular"
                appearance="secondaryText"
                style={hasActions ? spacings.mbSm : undefined}
              >
                {text}
              </Text>
            )}
            <View
              style={[
                flexbox.directionRow,
                flexbox.alignCenter,
                flexbox.justifyEnd,
                isWeb && flexbox.wrap,
                { width: '100%' }
              ]}
            >
              {hasDismissAction && (
                <BannerButton
                  type="secondary"
                  colorType="error"
                  onPress={onDismissButtonPress}
                  testID="banner-button-reject"
                  style={hasPrimaryAction && spacings.mrTy}
                >
                  {dismissButtonText}
                </BannerButton>
              )}
              {hasPrimaryAction && (
                <BannerButton
                  type="primary"
                  colorType={type}
                  onPress={onPress}
                  testID={`dashboard-${type}-banner`}
                >
                  {buttonText}
                </BannerButton>
              )}
            </View>
          </View>
        )}
        {children}
      </View>
    )
  }
)

Banner.displayName = 'Banner'

export default Banner
