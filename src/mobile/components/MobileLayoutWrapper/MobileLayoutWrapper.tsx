import React, { ReactNode } from 'react'
import { ColorValue, View, ViewStyle } from 'react-native'
import {
  KeyboardAwareScrollView,
  KeyboardAwareScrollViewProps
} from 'react-native-keyboard-controller'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { PanelBackButton, PanelTitle } from '@common/components/Panel/Panel'
import { WrapperProps } from '@common/components/ScrollableWrapper'
import useTheme from '@common/hooks/useTheme'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'

type MobileLayoutContainerProps = {
  backgroundColor?: ColorValue
  header?: ReactNode
  footer?: ReactNode
  footerStyle?: ViewStyle
  children: ReactNode | ReactNode[]
  renderDirectChildren?: () => ReactNode
  style?: ViewStyle
  withHorizontalPadding?: boolean
}

export const MobileLayoutContainer = ({
  backgroundColor,
  header,
  footer,
  footerStyle,
  children,
  renderDirectChildren,
  style,
  withHorizontalPadding = false
}: MobileLayoutContainerProps) => {
  const { theme, styles } = useTheme(getStyles)
  const insets = useSafeAreaInsets()

  return (
    <View
      style={[
        flexbox.flex1,
        {
          backgroundColor: backgroundColor || theme.primaryBackground,
          paddingTop: insets.top,
          paddingBottom: insets.bottom
        }
      ]}
    >
      {!!header && header}
      <View style={[flexbox.flex1, withHorizontalPadding ? spacings.phSm : undefined]}>
        <View
          style={[
            flexbox.directionRow,
            flexbox.flex1,
            {
              backgroundColor: backgroundColor || theme.primaryBackground,
              width: '100%'
            },
            style
          ]}
        >
          {children}
        </View>
      </View>
      {!!footer && (
        <View style={styles.footerContainer}>
          <View style={[styles.footer, footerStyle]}>{footer}</View>
        </View>
      )}
      {renderDirectChildren && renderDirectChildren()}
    </View>
  )
}

interface MobileLayoutWrapperMainContentProps extends WrapperProps {
  children: ReactNode
  withScroll?: boolean
  wrapperRef?: any
  withBackButton?: boolean
  keyboardAwareScrollViewProps?: KeyboardAwareScrollViewProps
  onBackButtonPress?: () => void
  rightIcon?: ReactNode
  onRightIconPress?: () => void
  title?: string
  step?: number
  totalSteps?: number
}

export const MobileLayoutWrapperMainContent: React.FC<MobileLayoutWrapperMainContentProps> = ({
  children,
  wrapperRef,
  contentContainerStyle = {},
  withScroll = false,
  keyboardAwareScrollViewProps = {},
  withBackButton = false,
  onBackButtonPress = () => {},
  rightIcon,
  onRightIconPress = () => {},
  title,
  step = 0,
  totalSteps = 2,
  ...rest
}: MobileLayoutWrapperMainContentProps) => {
  const { styles, theme } = useTheme(getStyles)
  const { isOnboardingRoute } = useOnboardingNavigation()

  const renderProgress = () => (
    <View style={[styles.progressContainer]}>
      {[...Array(totalSteps)].map((_, index) => (
        <View
          key={`step-${index.toString()}`}
          style={[
            styles.progress,
            index > 0 ? spacings.mlMi : undefined,
            {
              backgroundColor: index < step ? theme.successDecorative : theme.tertiaryBackground
            }
          ]}
        />
      ))}
    </View>
  )

  if (withScroll) {
    return (
      <View style={[flexbox.flex1, spacings.phSm]}>
        {step > 0 ? (
          renderProgress()
        ) : (
          <View style={{ height: isOnboardingRoute ? 28 : SPACING_SM }} />
        )}
        {(!!title || !!withBackButton) && (
          <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mb2Xl]}>
            {!!withBackButton && <PanelBackButton onPress={onBackButtonPress} />}
            {!!title && <PanelTitle title={title} size={18} />}
            {!!withBackButton && <View style={[{ width: 28 }, flexbox.alignEnd]}>{rightIcon}</View>}
          </View>
        )}
        <KeyboardAwareScrollView
          ref={wrapperRef}
          style={flexbox.flex1}
          contentContainerStyle={[{ flexGrow: 1 }, spacings.pbSm, contentContainerStyle]}
          {...keyboardAwareScrollViewProps}
          {...rest}
        >
          {children}
        </KeyboardAwareScrollView>
      </View>
    )
  }

  return (
    <View
      ref={wrapperRef}
      style={[flexbox.flex1, spacings.phSm, spacings.pbSm, contentContainerStyle]}
    >
      {step > 0 ? (
        renderProgress()
      ) : (
        <View style={{ height: isOnboardingRoute ? 28 : SPACING_SM }} />
      )}
      {(!!title || !!withBackButton) && (
        <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mbXl]}>
          {!!withBackButton && <PanelBackButton onPress={onBackButtonPress} />}
          {!!title && <PanelTitle title={title} size={18} />}
          {!!withBackButton && <View style={{ width: 28 }} />}
        </View>
      )}
      {children}
    </View>
  )
}
